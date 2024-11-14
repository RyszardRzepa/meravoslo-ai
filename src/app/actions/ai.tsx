import 'server-only';
import { createAI, createStreamableUI, getMutableAIState, getAIState } from 'ai/rsc';
import { BotCard, BotMessage } from '@/components/message';
import { runAsyncFnWithoutBlocking, runOpenAICompletion } from '@/lib/utils';
import { Skeleton } from '@/components/skeleton';
import {
  createEmbedding,
  searchActivitiesByTags,
  searchPlacesByTags,
  vectorSearchActivities,
  vectorSearchPlaces
} from "@/lib/db";
import { extractTags } from "@/lib/agents/extractTags";
import { z } from "zod";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase/backend";
import Recommendations from "@/components/recommendations";
import { recommendationCreator } from "@/lib/agents/recommendationCreator";
import { OpenAI } from "openai";
import { Recommendation, Role, SearchType, TabName } from "@/lib/types";
import { saveMessage } from "@/app/actions/db";
import { spinner } from '@/components/spinner';
import { handleGlobalError } from "@/lib/handleGlobalError";

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
      role: 'system', name: 'startBookingProcess', content: 'Starting the booking process...',
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

const localPrompt = `Respond to food and drink, activities, things-to-do related questions, utilizing the correct function call or providing relevant context-based responses for recommendations and insights on Norwegian culture. Address follow-up queries effectively using context and chat history.

## Guidelines

- **Question Handling**:
  - Respond with up to three recommendation.
  - A follow-up question is any additional inquiry related to a previous answer, often requesting more details or clarification. If a follow-up question is asked, respond using the context from earlier responses, without calling tools \`tags_search\` or \`vector_search\`.
  - Only respond to questions related to food and drink, activities and what to do. If the question is not related to food or drink, respond "Jeg kan dessverre bare gi anbefalinger om mat og drikke og aktiviteter i Oslo. Hvis du har spørsmål om mat og drikke og aktiviteter, er jeg her for å hjelpe"

- **Tool Calls**:
  - Use \`tags_search\` if \`filterTags=true\`, example  filterTags=true and the question is not a follow-up.
  - Use \`vector_search\` if \`filterTags=false\` is empty, example  filterTags=false and the question is not a follow-up.

- **Handling Follow-up Questions**:
  - Depending on the conversation history, address follow-up questions by referencing earlier suggestions for continuity.

- **Response Structure**:
  - Use \`<context>\` tone for non-food or drink-related questions, focusing on the available context.
  - Make sure responses are precise and answer the \`<userQuestion>\` directly.

- **Details and Formatting**:
  - Use markdown for styling any additional content like addresses and links.
  - Provide one recommendation per inquiry.
  - Direct users to relevant websites for additional information.
  - Avoid ending responses with questions.

## Response Format

- Use markdown for formatting.
- Respond in the user's preferred language.
- Include images only if specifically requested.

## Examples

### Example 1
**Input:** "Can you suggest a romantic restaurant in Oslo for dinner?"
**Output:** 
- "For a romantic dinner in Oslo, you might consider [Place Name]. It's known for its cozy atmosphere and exquisite cuisine. Check their menu [here] for more details."

### Example 2
**Input:** "Jeg vil kjøpe bolig?"
**Output:** 
- "Jeg kan dessverre bare gi anbefalinger om mat og drikke og aktiviteter i Oslo. Hvis du har spørsmål om mat og drikke og aktiviteter, er jeg her for å hjelpe!"

### Example 3
**Input:** "Do you have more information on the restaurant you suggested earlier?"
**Output:** 
- "Certainly! The restaurant [Place Name] offers a diverse menu and an inviting atmosphere. You can make reservations via their website [here]."

## Notes

- Use search functions correctly according to the guidelines, and manage follow-up inquiries using chat history.
- Keep responses courteous and informative, with a focus on food, drink, and cultural topics.

## Important
Only respond to questions related to food and drink and activities.". `

async function submitUserMessage({ content, uid, threadId, name }: UserMessage) {
  'use server';

  try {
    // Save user question to db
    saveMessage({ message: content, role: Role.User, uid: uid!, threadId, type: SearchType.Inspirations });

    const aiState = getMutableAIState<typeof AI>();

    //Since we are passing data from different tabs UI, we need to filter out the messages that are not from the same tab
    const aiStateFiltered = aiState.get().filter((info: any) => info.name === name);

    aiState.update([
      ...aiStateFiltered,
      {
        role: 'user',
        content,
        name,
      }]);

    const reply = createStreamableUI(<BotMessage className="items-center">{spinner}</BotMessage>);

    runAsyncFnWithoutBlocking(async () => {
      reply.update(
        <BotCard>
          <Skeleton/>
        </BotCard>
      );

      // const promptName = name === TabName.ACTIVITIES ? "activityRecommendations" : "placeRecommendation";

      const [filterTags] = await Promise.all([
        extractTags(content),
        // supabase.from("prompts").select("text").eq("name", promptName)
      ]);

      let context = "";

      console.log("filterTags!!!", filterTags)

      if (filterTags?.length === 0) {
        const embedding = await createEmbedding(content);
        const [activitySearch, placeSearch] = await Promise.all([vectorSearchActivities(embedding), vectorSearchPlaces(embedding)]);
        context = `Activity context: ${activitySearch}.
        Place context: ${placeSearch}.
        `
      }

      const enhancedPrompt = `
      ${localPrompt}.
      
      Context: <context> ${context} </context>.
      Filter tags: filterTags=${filterTags.length > 0 ? "true" : "false"}.
      Chat History: <chatHistory> ${JSON.stringify(aiState.get())} </chatHistory>.
      
      User question: ${content}`;

      const completion = runOpenAICompletion(client, {
        model: 'gpt-4o-mini',
        stream: true,
        temperature: 0.3,
        max_tokens: 10000,
        messages: [
          {
            role: 'user',
            content: `${enhancedPrompt}`,
          }],
        functions: [
          {
            name: 'vector_search',
            description: 'Create up to three recommendations based on the <context> in system message',
            parameters: z.object({
              title: z.string().describe('Short response to the user in the users language'),
              recommendations: z.array(z.object({
                businessId: z.string().describe('The value of <places_id>'),
                summary: z.string().describe('Short summary of the recommended place in the user language. Max 4 sentences.'),
                tableName: z.string().describe('The value of <table_name>'),
              })),
            }),
          },
          {
            name: 'tags_search',
            description: 'Return only number "1" as done.',
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
            threadId,
            type: SearchType.Inspirations
          });
          reply.done();
          aiState.done([...aiState.get(), { role: 'assistant', content }]);
        }
      });

      completion.onFunctionCall('vector_search', async ({ recommendations, title }) => {
        reply.update(<BotCard>
          <Skeleton/>
        </BotCard>);

        console.log("recommendations", recommendations)
        console.log("🎯vector_search")
        const select = "id, images, name, mapsUrl, address, bookingUrl, district, openingHours, articleUrl, articleTitle";
        const placesRecordsIds = recommendations.filter(item => {
          return item.tableName === 'places';
        }).map((rec) => rec.businessId)

        const activitiesRecordsIds = recommendations.filter(item => {
          return item.tableName === 'activities';
        }).map((rec) => rec.businessId)


        const {
          data: activities,
        } = await supabase.from("activities").select(select).in('id', activitiesRecordsIds);

        const {
          data: places,
          error
        } = await supabase.from("places").select(select).in('id', placesRecordsIds);

        const allData = [...(activities || []), ...(places || [])];

        const recommendationData = recommendations.map((aiRec) => {
          const business = allData.find((doc) => doc.id === Number(aiRec.businessId));

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

        if (recommendationData.length === 0) {
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
          threadId,
          type: SearchType.Inspirations
        });

        aiState.done([...aiState.get(), {
          role: 'function',
          content: `Assistant responded with these recommendations: ${JSON.stringify(recommendations)}`,
          name,
        }]);
      });

      completion.onFunctionCall('tags_search', async () => {
        reply.update(<BotCard>
          <Skeleton/>
        </BotCard>);

        console.log("🏷️tags_search")
        const [placesResponse, activitiesResponse] = await Promise.all([searchPlacesByTags(filterTags), searchActivitiesByTags(filterTags)])
        const response = [...placesResponse.slice(0,2), ...activitiesResponse.slice(0,2)]


        let placesContext = "";

          placesResponse.slice(0,2).map((item) => {
            placesContext += `<place>
                   Restaurant name: ${item.name}.
                   Article title: ${item.articleTitle}. \n 
                   Article content: ${item.articleContent}. \n
                   <place_id> ${item.id} </place_id>
                 </place>.\n`
          })

        let activitiesContext = "";

        activitiesResponse.slice(0,2).map((item) => {
            activitiesContext += `<activity>
                 Name: ${item.name}. \n 
                 Article title: ${item.articleTitle}. \n 
                 Article content: ${item.articleContent}. \n
                 <place_id> ${item.id} </place_id>. \n
                 </activity>.\n`
        })

        const context = `Places context ${placesContext} \n Activities context ${activitiesContext}`

        const recommendationsResponse = await recommendationCreator(context, content, aiStateFiltered)

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
          threadId,
          type: SearchType.Inspirations
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
          role: 'function',
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
  role: 'user' | 'assistant' | 'system' | 'function'; content: string; id?: string; name?: string;
}[] = [];

const initialUIState: {
  name: string;
  id: number;
  display: React.ReactNode;
  message?: string;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
    submitBookingState,
    resetAIState
  }, initialUIState, initialAIState,
});
