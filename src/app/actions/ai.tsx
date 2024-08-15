import 'server-only';
import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import { BotCard, BotMessage, spinner } from '@/components/llm-stocks';

import { runAsyncFnWithoutBlocking, runOpenAICompletion } from '@/lib/utils';
import { Skeleton } from '@/components/llm-stocks/stocks-skeleton';
import { searchDocs } from "@/lib/db";
import { extractTags } from "@/lib/agents/extractTags";
import { z } from "zod";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase/backend";
import Recommendations from "@/components/recommendations";
import { recommendationCreator } from "@/lib/agents/recommendationCreator";
import { wrapOpenAI } from "langsmith/wrappers";
import { OpenAI } from "openai";

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
};

async function submitUserMessage({ content, uid, threadId }: UserMessage) {
  'use server';

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

    const [context, filterTags] = await Promise.all([searchDocs(content), extractTags(content)]);

    console.log("filterTags", filterTags)

    const prompt = `
    You are a knowledgeable Norwegian culture, food and travel assistant.
    Respond in markdown format. Respond in the user's language. If unable to answer directly, provide a relevant recommendation instead based on the context. Don't return images in the response.
    
    Guidelines:
    - If the <filterTags> object is not empty, call \`tags_search\`. Don't call  \`vector_search\`. If user ask for activities to do in the same query, reply that you can only provide recommendations for food.
    - If the user ask followup question for recommendations to eat food and if the <filterTags> object is empty, call \`vector_search\`. Example: "A place to eat for 6 ppl", "Romantic places for a date", etc. If user ask for activities to do in the same query, reply that you can only provide recommendations for food.
    - If user ask follow-up questions related to previous recommendations, don't call \`vector_search\` or \`tags_search\`. Answer question based on the chat history. 
    - If user ask a question that is not releated to Norwegian culture, food and travel assistant, reply accordingly using tone of voice from the provided <context>.
    - Always response only with the information that reply to <userQuestion>, nothing else.
    - If user ask for address, map, or booking url, provide the information in the response in markdown format with the url.
    - If user ask for a specific place, return only one recommendation.
    - If you don't have a direct answer, suggest visiting a place website if you have it.
    - Respond with the links only if they are provided in the context.
    - If user ask for a price, reply with the price range if you have the information in the context. If not, suggest visiting place website with the meny.
    Answer the question based only on the following context and user question, and chat history.
    Context: <context> ${context} </context>
    Filter Params: <filterTags> ${JSON.stringify(filterTags)} </filterParams>
    User Question: <userQuestion> ${content} </userQuestion>
    Chat History: <chatHistory> ${JSON.stringify(aiState.get())} </chatHistory>
    `;

    const completion = runOpenAICompletion(client, {
      model: 'gpt-4o-mini',
      stream: true,
      messages: [{
        role: 'system',
        content: prompt,
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
            suggestions: z.array(z.string().describe('Suggestions for followup questions')),
            recommendations: z.array(z.object({
              docId: z.string().describe('The value of <doc_id>'),
              restaurantId: z.string().describe('The value of <res_id>'),
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
      ], temperature: 0,
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
        reply.done();
        aiState.done([...aiState.get(), { role: 'assistant', content }]);
      }
    });

    completion.onFunctionCall('vector_search', async ({ recommendations, title, suggestions }) => {
      reply.update(<BotCard>
        <Skeleton />
      </BotCard>);

      console.log("🎯vector_search")
      const select = "id, images, restaurant(name, mapsUrl, address, bookingUrl, district, openingHours)"
      const { data, error } = await supabase.from('documents').select(select).in('id', recommendations.map((r: {
        docId: string;
      }) => Number(r.docId)));

      const recommendationData = recommendations.map((rec) => {
        const docData = data?.find((doc: { id: number; restaurant: any }) => doc.id === Number(rec.docId));

        const { restaurant } = docData || {} as any;

        return {
          summary: rec?.summary,
          images: docData?.images,
          address: restaurant?.address,
          mapsUrl: restaurant?.mapsUrl,
          bookingUrl: restaurant?.bookingUrl,
          name: restaurant?.name,
          district: restaurant?.district,
          openingHours: restaurant?.openingHours,
        }
      });

      reply.done(
        <div className="flex flex-col gap-4">
          <BotCard>
            <Recommendations title={title} data={recommendationData} />
          </BotCard>
        </div>
      );
      aiState.done([...aiState.get(), {
        role: 'function', name: 'tags_search', content: JSON.stringify(recommendationData),
      }]);
    });

    completion.onFunctionCall('tags_search', async () => {
      reply.update(<BotCard>
        <Skeleton />
      </BotCard>);

      console.log("tags_search")

      const { data: restaurants, error } = await supabase
        .rpc('restaurant_tag_search', { initial_tags: filterTags })

      // filter out the documents that have the same restaurant name
      const restaurantIds = new Set();
      const filteredData = restaurants.filter((doc: any) => {
        if (restaurantIds.has(doc.name)) {
          return false;
        }
        restaurantIds.add(doc.name);
        return true;
      });

      const context = [...filteredData].map((restaurant: any) => {
        return `<restaurant>
 Restaurant name: ${restaurant.name}.
 Tags: ${restaurant.tags}. 
 Matched tags: ${restaurant.matchedTags}.
 Searched tags: ${restaurant.searchedTags}.
 About restaurant: ${restaurant.documentTitle}. \n ${restaurant.documentContent}
 <doc_id>${restaurant.documentId}</doc_id>
 </restaurant>.\n`
      }).join(", ")

      console.log("context", context)
      const [recommendationsResponse] = await Promise.all([recommendationCreator(context, content, aiState)])

      console.log("recommendationsResponse", recommendationsResponse)
      const recommendationData = recommendationsResponse?.recommendations.map((aiRec: { id: any; summary: any; }) => {
        const restaurant = restaurants.find((r: any) => r.id === aiRec.id);

        return {
          summary: aiRec?.summary,
          address: restaurant?.address,
          mapsUrl: restaurant?.mapsUrl,
          images: restaurant?.documentImages,
          bookingUrl: restaurant?.bookingUrl,
          name: restaurant?.name,
          district: restaurant?.district,
          openingHours: restaurant?.openingHours,
        };
      });

      reply.done(
        <div className="flex flex-col gap-4">
          <BotCard>
            <Recommendations title={recommendationsResponse?.title} data={recommendationData} />
          </BotCard>
        </div>
      );

      aiState.done([...aiState.get(), {
        role: 'function',
        name: 'tags_search',
        content: `assistant responded with these recommendations: ${JSON.stringify(recommendationsResponse)}`
      }]);
    });
  });

  return {
    id: Date.now(), display: reply.value,
  };
}

// Define necessary types and create the AI.
const initialAIState: {
  role: 'user' | 'assistant' | 'system' | 'function'; content: string; id?: string; name?: string;
}[] = [];

const initialUIState: {
  id: number; display: React.ReactNode; message?: string;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
    submitBookingState,
  }, initialUIState, initialAIState,
});
