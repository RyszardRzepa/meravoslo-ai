import 'server-only';
import { createAI, createStreamableUI, getMutableAIState, getAIState } from 'ai/rsc';
import { BotCard, BotMessage } from '@/components/message';

import { runAsyncFnWithoutBlocking, runOpenAICompletion } from '@/lib/utils';
import { Skeleton } from '@/components/skeleton';
import { searchActivitiesByTags, searchPlacesByTags, vectorSearchActivities, vectorSearchPlaces } from "@/lib/db";
import { extractTags, getCurrentSeason } from "@/lib/agents/extractTags";

import { z } from "zod";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase/backend";
import Recommendations from "@/components/recommendations";
import { recommendationCreator } from "@/lib/agents/recommendationCreator";
import { OpenAI } from "openai";
import { Recommendation, Role, TabName } from "@/lib/types";
import { hybridSearchActivities, hybridSearchPlaces, saveMessage } from "@/app/actions/db";
import { spinner } from '@/components/spinner';
import { handleGlobalError } from "@/lib/handleGlobalError";
import { getQuestionContext } from "@/lib/agents/getQuestionContext";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function submitBookingState(restaurantName: string) {
  'use server';

  try {
    const aiState = getMutableAIState<typeof AI>();

    const reply = createStreamableUI(<BotMessage>{spinner}</BotMessage>);

    reply.done(<BotCard>
      <div>Takk for Booking hos {restaurantName} 😋 Er det noe
        annet du lurer på?
      </div>
    </BotCard>);

    aiState.done([...aiState.get(), {
      role: Role.Assistant,
      name: 'startBookingProcess',
      content: 'Starting the booking process...',
    }]);

    return {
      id: Date.now(), display: reply.value,
    };
  } catch (error) {
    handleGlobalError(error);
  }
}

type UserMessage = {
  content: string;
  uid: string;
  threadId: number;
  name: string;
};

async function resetAIState() {
  'use server';

  const aiState = getMutableAIState<typeof AI>();
  aiState.done(initialAIState);
}

async function submitUserMessage({ content, uid, threadId, name }: UserMessage) {
  'use server';

  try {
    // Save user question to db
    saveMessage({ message: content, role: Role.User, uid: uid!, threadId });

    const aiState = getMutableAIState<typeof AI>();

    //Since we are passing data from different tabs UI, we need to filter out the messages that are not from the same tab
    const aiStateFiltered = aiState.get().filter((info: any) => info.name === name);
    const userQuestionHistory: string = aiState.get()
      .filter((item: any) => item.role === Role.User)
      .map((item, i) => `<question>User asked: ${item.content}<question>`).join('.\n');
    const chatHistory = JSON.stringify(aiState.get())

    aiState.update([
      ...aiStateFiltered,
      {
        role: Role.User,
        content,
        name,
      }]);

    const reply = createStreamableUI(<BotMessage>{spinner}</BotMessage>);

    runAsyncFnWithoutBlocking(async () => {
      reply.update(
        <BotCard>
          <Skeleton/>
        </BotCard>
      );

      const hybridSearch = name === TabName.ACTIVITIES ? hybridSearchActivities : hybridSearchPlaces;
      const promptName = name === TabName.ACTIVITIES ? "activityRecommendations" : "placeRecommendation";

      const { question } = await getQuestionContext({
        question: content,
        userQuestionHistory,
        chatHistory,
      });

      const [searchResponse, filterTags, prompt] = await Promise.all([
        hybridSearch(question),
        extractTags(question),
        supabase.from("prompts").select("text").eq("name", promptName)
      ]);

      const savedSearchResponseIds = aiState.get().find((item: any) => item.type === "searchResponseIds")?.ids || []

      const uniqueSearchResponse = searchResponse.filter((item: any) => !savedSearchResponseIds.includes(item.id));

      const context = uniqueSearchResponse.slice(0, 3)?.map((doc: any) => {
        return `<data>
                  Activity Name: ${doc.name}. 
                  About: ${doc.articleContent}.
                  <doc_id>${doc?.id}</doc_id>.
               <data>`;
      }).join('\n');

      console.log("rephrased question:", question)
      console.log("filterTags: ", filterTags)
      console.log("savedSearchResponseIds", savedSearchResponseIds)

      let enhancedPrompt = `
      ${prompt?.data?.[0]?.text}. \n
      Context:  <context> ${context} </context>. \n
      Filter tags: filterTags:${filterTags.length ? "true" : "false"} \n
      Chat History: <chatHistory> ${chatHistory} </chatHistory>. \n
      
      Recommend only ${name} from <data> that is a good match for current season: ${getCurrentSeason()}. For example
       don't recommend mushrom picking in winter \n
      
      User question: ${question}`;

      const completion = runOpenAICompletion(client, {
        model: 'gpt-4o-mini',
        stream: true,
        temperature: 0.5,
        max_tokens: 10000,
        messages: [
          {
            role: 'user',
            content: `${enhancedPrompt}`,
          }],
        functions: [
          {
            name: 'vector_search',
            description: `Create 3 recommendations based on the <context>`,
            parameters: z.object({
              title: z.string().describe('Short response to the user in the users language'),
              recommendations: z.array(z.object({
                docId: z.string().describe('The value of <doc_id>'),
                summary: z.string().describe(`Short summary of the recommended place in the user language. Max 2 sentences. Don't mention going for a date if not asked specifically.`),
              })),
            }),
          },
          {
            name: 'tags_search',
            description: 'Return only number "1"',
            parameters: z.object({
              done: z.string().describe('number "1"'),
            }),
          }
        ],
      });

      completion.onTextContent((content: string, isFinal: boolean) => {
        const MarkdownWithLink = ({ content }: { content: string }) => {
          return <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: props => {
                return (
                  <a target="_blank" href={props.href} className="text-blue-400">{props.children}</a>
                );
              },
            }}
          >
            {content}
          </Markdown>;
        };

        reply.update(<BotMessage>
          <MarkdownWithLink content={content}/>
        </BotMessage>);
        if (isFinal) {
          saveMessage({
            message: content,
            role: Role.Assistant,
            completionType: 'markdown',
            userQuestionTags: filterTags,
            uid: uid!,
            threadId
          });
          reply.done();
          aiState.done([...aiState.get(), { role: Role.User, content }]);
        }
      });

      completion.onFunctionCall('vector_search', async ({ recommendations, title }) => {
        reply.update(<BotCard>
          <Skeleton/>
        </BotCard>);

        console.log("🎯vector_search")
        const tableName = name === TabName.ACTIVITIES ? "activities" : "places";
        const select = "id, images, name, mapsUrl, address, bookingUrl, district, openingHours, articleUrl, articleTitle";

        const aiRecommendationsIds = recommendations.map((aiRec) => {
          return Number(aiRec.docId)
        })

        const index = aiState.get().findIndex((item) => item.type === "searchResponseIds");
        const updatedAiState = aiState.get();
        if (index !== -1) {
          updatedAiState[index].ids = [...aiRecommendationsIds, ...savedSearchResponseIds];
        } else {
          updatedAiState.push({
            type: "searchResponseIds",
            ids: [...aiRecommendationsIds],
            role: Role.Function,
            name,
            content
          });
        }

        aiState.update(updatedAiState);

        const {
          data,
          error
        } = await supabase.from(tableName).select(select).in('id', recommendations.map((r) => Number(r.docId)));

        const recommendationData = recommendations.map((aiRec) => {
          const business = data?.find((doc) => doc.id === Number(aiRec.docId));

          return {
            articleTitle: business?.articleTitle,
            summary: aiRec.summary,
            businessName: business?.name,
            address: business?.address,
            mapsUrl: business?.mapsUrl,
            images: business?.images,
            bookingUrl: business?.bookingUrl,
            district: business?.district,
            openingHours: business?.openingHours,
            articleUrl: business?.articleUrl,
          }
        });

        if (!recommendationData) {
          reply.done(
            <div className="flex flex-col gap-4">
              <BotCard>
                <p>Beklager, vi fant ingen anbefalinger til deg.</p>
              </BotCard>
            </div>
          )
        } else {
          reply.done(
            <div className="flex flex-col gap-4">
              <BotCard>
                <Recommendations data={recommendationData}/>
              </BotCard>
            </div>
          );
        }

        saveMessage({
          jsonResponse: recommendationData,
          role: Role.Assistant,
          completionType: 'vector_search',
          userQuestionTags: filterTags,
          uid: uid!,
          threadId
        });

        aiState.done([...aiState.get(), {
          role: Role.Function,
          content: `Assistant responded with these recommendations: ${JSON.stringify(recommendations)}`,
          name,
        }]);
      });

      completion.onFunctionCall('tags_search', async () => {
        reply.update(<BotCard>
          <Skeleton/>
        </BotCard>);

        console.log("🏷️tags_search")
        const response = TabName.EAT_DRINK === name ? await searchPlacesByTags(filterTags) : await searchActivitiesByTags(filterTags)

        console.log("response length", response.length)
        const searchIds = response.slice(0,3).map((doc) => {
          return Number(doc.id)
        })

        const index = aiState.get().findIndex((item) => item.type === "searchResponseIds");
        const updatedAiState = aiState.get();
        if (index !== -1) {
          updatedAiState[index].ids = [...searchIds, ...savedSearchResponseIds];
        } else {
          updatedAiState.push({
            type: "searchResponseIds",
            ids: [...searchIds],
            role: Role.Function,
            name,
            content
          });
        }

        aiState.update(updatedAiState);

        const context = response.map((item) => {
          return `<restaurant>
                 Restaurant name: ${item.name}.
                 Tags: ${item.tags}. 
                 Matched tags: ${item.matched_tags}.
                 Searched tags: ${item.searched_tags}.
                 About restaurant: ${item.articleTitle}. \n ${item.articleContent}
                 <doc_id> ${item.id} </doc_id>
                 </restaurant>.\n`
        }).join(", ")

        const [recommendationsResponse] = await Promise.all([recommendationCreator(context, content, aiStateFiltered)])

        const recommendationData = recommendationsResponse?.recommendations.map((aiRec) => {
          const business = response.find((r) => r.id === aiRec.businessId);

          return {
            articleTitle: business?.articleTitle,
            businessName: business?.name,
            summary: aiRec.content,
            address: business?.address,
            mapsUrl: business?.mapsUrl,
            images: business?.images,
            bookingUrl: business?.bookingUrl,
            district: business?.district,
            openingHours: business?.openingHours,
            articleUrl: business?.articleUrl,
          } as Recommendation
        });

        saveMessage({
          jsonResponse: recommendationData,
          role: Role.Assistant,
          completionType: 'tags_search',
          userQuestionTags: filterTags,
          uid: uid!,
          threadId
        })

        if (!recommendationData) {
          reply.done(
            <div className="flex flex-col gap-4">
              <BotCard>
                <p>Beklager, vi fant ingen anbefalinger til deg.</p>
              </BotCard>
            </div>
          )
        } else {
          reply.done(
            <div className="flex flex-col gap-4">
              <BotCard>
                <Recommendations data={recommendationData}/>
              </BotCard>
            </div>
          );
        }

        aiState.done([...aiState.get(), {
          role: Role.Function,
          content: `Assistant responded with these recommendations: ${JSON.stringify(recommendationsResponse)}`,
          name,
        }]);
      });
    });

    return {
      id: Date.now(), display: reply.value, name
    };
  } catch (error) {
    handleGlobalError(error);
    return {
      id: Date.now(), display: "Noe gikk galt. vennligst prøv igjen", name
    };
  }
}

// Define necessary types and create the AI.
const initialAIState: {
  role: Role;
  content: string;
  id?: string;
  name?: string;
  ids?: number[];
  type?: string;
}[] = [];

const initialUIState: {
  name: string;
  id: number;
  display: React.ReactNode;
  message?: string;
  searchResponse?: any;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
    submitBookingState,
    resetAIState
  }, initialUIState, initialAIState,
});
