import { querySuggester } from "@/lib/agents/querySuggester";
import { runOpenAICompletion } from "@/lib/utils";
import { openai, searchDocs, searchRestaurants, supabase } from "@/lib/db";
import { z } from "zod";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BotCard, BotMessage } from "@/components/llm-stocks";
import { Skeleton } from "@/components/llm-stocks/stocks-skeleton";
import Recommendations from "@/components/recommendations";
import { SuggestionCard } from "@/components/llm-stocks/message";
import { recommendationCreator } from "@/lib/agents/recommendationCreator";
import { OpenAI } from "openai";

// https://docs.smith.langchain.com/tutorials/observability
import { wrapOpenAI } from "langsmith/wrappers";
import { getFilterParams } from "@/lib/agents/getFilterParams";
const client = wrapOpenAI(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}));

type DefaultResponse = {
  aiState: any;
  reply: any;
  userQuestion: string;
  query: string;
  uid: string;
  threadId: number;
}

export const handleDefaultResponse = async ({
                                              aiState,
                                              reply,
                                              userQuestion,
                                              query,
                                              uid,
                                              threadId
                                            }: DefaultResponse) => {
  const querySuggesterPromise = querySuggester(query)
  const [context, filterParams] = await Promise.all([searchDocs(userQuestion), getFilterParams(userQuestion)]);

  console.log("filterParams", filterParams)

  const prompt = `\
You are a knowledgeable Norwegian culture, food and travel assistant.
Respond in markdown format. Respond in the user's language. If unable to answer directly, provide a relevant recommendation instead based on the context. Don't return images in the response.

Guidelines:
- If the user ask for recommendations to eat food, call \`get_recommendations\`. Example: "A place to eat for 6 ppl", "Romantic places for a date", etc.
- If the <filterParams> object is not empty, call \`get_exact_recommendations\`. Don't call  \`get_recommendations\`.
- If user ask follow-up questions related to previous recommendations, don't call \`get_recommendations\` or \`get_exact_recommendations\`. Answer question based on the context. 
- If user ask a question that is not releated to Norwegian culture, food and travel assistant, reply accordingly using tone of voice from the provided <context>.
- Always response only with the information that reply to <userQuestion>, nothing else.
- If user ask for address, map, or booking url, provide the information in the response in markdown format with the url.
- If user ask for a specific place, return only one recommendation.
- If you don't have a direct answer, suggest visiting a place website if you have it.
- If the user ask about close place nearby, ask for the user location and after provide the information based on the location.
- Respond with the links only if you they are provided in the context.
- If user ask for a price, reply with the price range if you have the information. If not, suggest visiting place website with the meny.
Answer the question based only on the following context and user question:
Context: <context> ${context} </context>
Filter Params: <filterParams> ${JSON.stringify(filterParams)} </filterParams>
User Question: <userQuestion> ${userQuestion} </userQuestion>
`;

  const completion = runOpenAICompletion(client, {
    model: 'gpt-4o',
    stream: true,
    messages: [{
      role: 'system',
      content: prompt,
    }, ...aiState.get().map((info: any) => ({
      role: info.role, content: info.content, name: info.name,
    }))],
    functions: [
      {
      name: 'get_recommendations',
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
        name: 'get_exact_recommendations',
        description: 'Return only number "1"',
        parameters: z.object({
          done: z.string().describe('number "1"'),
        }),
      }
    ], temperature: 0,
  });

  completion.onTextContent((content: string, isFinal: boolean) => {
    console.log("onTextContent")
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
      <MarkdownWithLink content={content}/>
    </BotMessage>);
    if (isFinal) {
      reply.done();
      aiState.done([...aiState.get(), { role: 'assistant', content }]);
    }
  });

  completion.onFunctionCall('get_recommendations', async ({ recommendations, title, suggestions }) => {
    reply.update(<BotCard>
        <Skeleton/>
      </BotCard>);

    console.log("get_recommendations")
    const select = "id, images, restaurant(name, mapsUrl, address, bookingUrl, district, openingHours)"
    const { data } = await supabase.from('documents').select(select).in('id', recommendations.map((r: {
      docId: string;
    }) => r.docId));

    const recommendationData = recommendations.map((rec) => {
      const docData = data?.find((doc: { id: number; restaurant: any }) => doc.id === Number(rec.docId));
      // @ts-ignore
      const { restaurant } = docData;

      return {
        summary: rec?.summary,
        images: docData?.images,
        address: restaurant?.address,
        mapsUrl: restaurant?.mapsUrl,
        bookingUrl: restaurant?.bookingUrl,
        name: restaurant?.name,
        district: restaurant?.district,
        openingHours: restaurant?.openingHours,
      };
    });

    // const querySuggestions = await querySuggesterPromise

    reply.done(
      <div className="flex flex-col gap-4">
      <BotCard>
        <Recommendations title={title} data={recommendationData}/>
    </BotCard>

        {/*{querySuggestions && (*/}
        {/*  <SuggestionCard*/}
        {/*    showAvatar={false}*/}
        {/*  suggestions={querySuggestions}*/}
        {/*  threadId={threadId}*/}
        {/*  uid={uid}*/}
        {/*  />)}*/}
      </div>
    );
      aiState.done([...aiState.get(), {
        role: 'function', name: 'get_recommendations', content: JSON.stringify(recommendationData),
      }]);
    });

  completion.onFunctionCall('get_exact_recommendations', async () => {
    reply.update(<BotCard>
      <Skeleton/>
    </BotCard>);

    console.log("exact recommendations")
    exactRecommendations({
      aiState, reply, filterParams, userQuestion, context, uid, threadId
    });
  });
  }

type FilterSearchResponse = {
  aiState: any;
  reply: any;
  filterParams: any;
  userQuestion: string;
  context: string;
  uid: string;
  threadId: number;
}
export const exactRecommendations = async ({
                                             aiState,
                                             reply,
                                             filterParams,
                                             userQuestion,
                                             context,
                                             uid,
                                             threadId
                                           }: FilterSearchResponse) => {
  // // Search for restaurants based on the filter params. Do not call this if no filter params are found
  const restaurants = await searchRestaurants(filterParams);

  // filter out the documents that have the same restaurant id
  const restaurantIds = new Set();
  const filteredData = restaurants.filter((doc: any) => {
    if (restaurantIds.has(doc.name)) {
      return false;
    }
    restaurantIds.add(doc.name);
    return true;
  });

  context = [...filteredData].map((restaurant: any) => {
    return `<restaurant>Restaurant: ${restaurant.name}. About: ${restaurant.title}. <doc_id>${restaurant.id}</doc_id></restaurant>.\n`
  }).join(", ")

  //Run the query suggester only if the filter params are found
  // const [querySuggestions, recommendationsResponse] = await Promise.all([querySuggester(userQuestion), recommendationCreator(context, userQuestion, aiState)])
  const [recommendationsResponse] = await Promise.all([recommendationCreator(context, userQuestion, aiState)])

  const recommendationData = recommendationsResponse?.recommendations.map((aiRec: { id: any; summary: any; }) => {
    const restaurant = restaurants.find((r: any) => r.id === aiRec.id);

    return {
      summary: aiRec?.summary,
      address: restaurant?.address,
      mapsUrl: restaurant?.mapsUrl,
      images: restaurant?.images,
      bookingUrl: restaurant?.bookingUrl,
      name: restaurant?.name,
      district: restaurant?.district,
      openingHours: restaurant?.openingHours,
    };
  });

  reply.done(
    <div className="flex flex-col gap-4">
      <BotCard>
        <Recommendations title={recommendationsResponse?.title} data={recommendationData}/>
      </BotCard>

      {/*{querySuggestions && (*/}
      {/*  <SuggestionCard*/}
      {/*    showAvatar={false}*/}
      {/*    suggestions={querySuggestions}*/}
      {/*    threadId={threadId}*/}
      {/*    uid={uid}*/}
      {/*  />)}*/}
    </div>
  );

  aiState.done([...aiState.get(), {
    role: 'function',
    name: 'get_exact_recommendations',
    content: `assistant responded with these recommendations: ${JSON.stringify(recommendationsResponse)}`
  }]);
}
