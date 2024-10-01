import 'server-only';
import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import { BotCard, BotMessage } from '@/components/message';

import { runAsyncFnWithoutBlocking, runOpenAICompletion } from '@/lib/utils';
import { Skeleton } from '@/components/skeleton';
import { searchActivitiesByTags, searchPlacesByTags, vectorSearchActivities, vectorSearchPlaces } from "@/lib/db";
import { extractTags } from "@/lib/agents/extractTags";
import { z } from "zod";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase/backend";
import Recommendations from "@/components/recommendations";
import { recommendationCreator } from "@/lib/agents/recommendationCreator";
import { wrapOpenAI } from "langsmith/wrappers";
import { OpenAI } from "openai";
import { Recommendation, Role, TabName } from "@/lib/types";
import { saveMessage } from "@/app/actions/db";
import { spinner } from '@/components/spinner';

const client = wrapOpenAI(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}));

async function submitBookingState(restaurantName: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  aiState.update([...aiState.get(), {
    role: 'system', content: 'Starting the booking process...',
  }]);

  const reply = createStreamableUI(<BotMessage>{spinner}</BotMessage>);

  reply.done(<BotCard>
    <div>Takk for Booking hos {restaurantName} 😋 Er det noe
      annet du lurer på?</div>
  </BotCard>);

  aiState.done([...aiState.get(), {
    role: 'system', name: 'startBookingProcess', content: 'Starting the booking process...',
  }]);

  return {
    id: Date.now(), display: reply.value,
  };
}

type UserMessage = {
  content: string;
  uid: string;
  threadId: number;
  name: string;
};

async function submitUserMessage({ content, uid, threadId, name }: UserMessage) {
  'use server';

  // Save user question to db
  saveMessage({ message: content, role: Role.User, uid: uid!, threadId });

  const aiState = getMutableAIState<typeof AI>();

  aiState.update([...aiState.get(), {
    role: 'user', content, name: 'submitUserMessage',
  }]);

  const reply = createStreamableUI(<BotMessage className="items-center">{spinner}</BotMessage>);

  runAsyncFnWithoutBlocking(async () => {
    reply.update(<BotCard>
      {spinner}
    </BotCard>);

    reply.update(
      <BotCard>
        <Skeleton/>
      </BotCard>
    );

    const vectorSearch = name === TabName.ACTIVITIES ? vectorSearchActivities : vectorSearchPlaces;
    const promptName = name === TabName.ACTIVITIES ? "activityRecommendations" : "placeRecommendation";

    const [context, filterTags, prompt] = await Promise.all([
      vectorSearch(content),
      extractTags(content),
      supabase.from("prompts").select("text").eq("name", promptName)
    ]);

    console.log("filterTags!!!", filterTags)

    const enhancedPrompt = `
    ${prompt?.data?.[0]?.text}.
    Context: <context> ${context} </context>
    Filter tags: <filterTags> ${JSON.stringify(filterTags)} </filterParams>
    User Question: <userQuestion> ${content} </userQuestion>
    Chat History: <chatHistory> ${JSON.stringify(aiState.get())} </chatHistory>
    `;

    const completion = runOpenAICompletion(client, {
      model: 'gpt-4o-mini',
      stream: true,
      temperature: 0.4,
      messages: [{
        role: 'system',
        content: enhancedPrompt,
      }, ...aiState.get().map((info: any) => ({
        role: info.role, content: info.content, name: info.name,
      }))],
      functions: [
        {
          name: 'vector_search',
          description: 'Create max three recommendations based on the <context> number of <restaurant>. So if there is' +
            ' only one <restaurant> in the context, return only one recommendation, etc.',
          parameters: z.object({
            title: z.string().describe('Short response to the user in the users language'),
            recommendations: z.array(z.object({
              businessId: z.string().describe('The value of <business_id>'),
              summary: z.string().describe('Short summary of the recommended place in the user language. Max 4 sentences.'),
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
                <a href={props.href} className="underline text-blue-400">{props.children}</a>
              );
            },
          }}
        >
          {content}
        </Markdown>;
      };

      reply.update(<BotMessage>
        <MarkdownWithLink content={content} />
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
        aiState.done([...aiState.get(), { role: 'assistant', content }]);
      }
    });

    completion.onFunctionCall('vector_search', async ({ recommendations, title }) => {
      reply.update(<BotCard>
        <Skeleton />
      </BotCard>);

      console.log("🎯vector_search")
      const tableName = name === TabName.ACTIVITIES ? "activities" : "places";
      const select = "id, images, name, mapsUrl, address, bookingUrl, district, openingHours, articleUrl";
      const { data, error } = await supabase.from(tableName).select(select).in('id', recommendations.map((r) => Number(r.businessId)));

      const recommendationData = recommendations.map((aiRec) => {
        const business = data?.find((doc) => doc.id === Number(aiRec.businessId));

        return {
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
        role: 'function', name: 'tags_search', content: JSON.stringify(recommendations),
      }]);
    });

    completion.onFunctionCall('tags_search', async () => {
      reply.update(<BotCard>
        <Skeleton />
      </BotCard>);

      console.log("🏷️tags_search")
      const response = TabName.EAT_DRINK === name ? await searchPlacesByTags(filterTags) : await searchActivitiesByTags(filterTags)

      const context = response.map((item) => {
        return `<restaurant>
                 Restaurant name: ${item.name}.
                 Tags: ${item.tags}. 
                 Matched tags: ${item.matched_tags}.
                 Searched tags: ${item.searched_tags}.
                 About restaurant: ${item.articleTitle}. \n ${item.articleContent}
                 <business_id> ${item.id} </business_id>
                 </restaurant>.\n`
                      }).join(", ")

      const [recommendationsResponse] = await Promise.all([recommendationCreator(context, content, aiState)])

      const recommendationData = recommendationsResponse?.recommendations.map((aiRec) => {
        const business = response.find((r) => r.id === aiRec.businessId);

        return {
          businessName: business?.name,
          summary: aiRec.content,
          address: business?.address,
          mapsUrl: business?.mapsUrl,
          images: business?.images,
          bookingUrl: business?.bookingUrl,
          district: business?.district,
          openingHours: business?.openingHours,
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
        role: 'function',
        name: 'tags_search',
        content: `assistant responded with these recommendations: ${JSON.stringify(recommendationsResponse)}`
      }]);
    });
  });

  return {
    id: Date.now(), display: reply.value, name
  };
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
  }, initialUIState, initialAIState,
});
