import 'server-only';
import OpenAI, { OpenAI as OpenAIEmbeddings } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { BotCard, BotMessage, Events, spinner, Stocks, SystemMessage } from '@/components/llm-stocks';

import { formatNumber, runAsyncFnWithoutBlocking, runOpenAICompletion, sleep } from '@/lib/utils';
import { z } from 'zod';
import { StocksSkeleton } from '@/components/llm-stocks/stocks-skeleton';
import Recommendations from '@/components/recommendations';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PRIVATE_KEY!);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  const purchasing = createStreamableUI(<div className="inline-flex items-start gap-1 md:items-center">
    {spinner}
    <p className="mb-2">
      Purchasing {amount} ${symbol}...
    </p>
  </div>);

  const systemMessage = createStreamableUI(null);

  runAsyncFnWithoutBlocking(async () => {
    // You can update the UI at any point.
    await sleep(1000);

    purchasing.update(<div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}... working on it...
      </p>
    </div>);

    await sleep(1000);

    purchasing.done(<div>
      <p className="mb-2">
        You have successfully purchased {amount} ${symbol}. Total cost:{' '}
        {formatNumber(amount * price)}
      </p>
    </div>);

    systemMessage.done(<SystemMessage>
      You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
      {formatNumber(amount * price)}.
    </SystemMessage>);

    aiState.done([...aiState.get(), {
      role: 'system',
      content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${amount * price}]`,
    }]);
  });

  return {
    purchasingUI: purchasing.value, newMessage: {
      id: Date.now(), display: systemMessage.value,
    },
  };
}

async function searchDocs(message: string) {
  const combineDocumentsFn = (docs) => {
    const serializedDocs = docs.map((doc) => {
      return `<content_start>
                ${doc.title} 
                about: ${doc.summary}. 
                Tags: ${doc?.tags?.map(tag => `${tag},`)}. 
                Menu: ${doc?.menu}. 
                <doc_id>${doc?.id}</doc_id>
              </content_end>`;
    });
    return serializedDocs.join('\n\n');
  };

  async function createEmbedding(text: string) {
    const openai = new OpenAIEmbeddings();
    const {
      data: [{ embedding }],
    } = await openai.embeddings.create({
      model: 'text-embedding-3-small', input: text, dimensions: 1536, // Generate an embedding with 1024 dimensions
    });
    return embedding;
  }

  const embedding = await createEmbedding(message);

  const { error: matchError, data: pageSections } = await supabase.rpc('match_documents_no_metadata', {
    query_embedding: embedding, match_threshold: 0.1, match_count: 3,
  });

  const documents = pageSections?.map((doc) => {
    return {
      id: doc.id,
      content: doc.content,
      similarity: doc.similarity,
      title: doc.title,
      summary: doc.summary,
      images: doc.images,
      address: doc.address,
      mapsUrl: doc.mapsUrl,
      bookingUrl: doc.bookingUrl,
      tags: doc.tags,
      menu: doc.menu,
    };
  });

  return combineDocumentsFn(documents);
}

async function submitUserMessage(content: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  //TODO classify user query
  // Search for relevant docs
  // const ads = await getAds(content); // search in ads table
  const context = await searchDocs(content);

  aiState.update([...aiState.get(), {
    role: 'user', content,
  }]);

  const reply = createStreamableUI(<BotMessage className="items-center">{spinner}</BotMessage>);

  const completion = runOpenAICompletion(openai, {
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: [{
      role: 'system',
      content: `\
You are a knowledgeable Norwegian culture and travel assistant.
Respond in markdown format. Respond in the user's language. If unable to answer directly, provide a relevant recommendation instead.

Guidelines:
- If the user ask for recommendations to eat food, call \`get_recommendations\`. Example: "A place to eat for 6 ppl", "Romantic places for a date", etc.
- If user ask for address, map, or booking url, provide the information in the response in markdown format with the url.

Answer the question based only on the following context:
Context: <context> ${context} </context>
`,
    }, ...aiState.get().map((info: any) => ({
      role: info.role, content: info.content, name: info.name,
    }))],
    functions: [{
      name: 'get_recommendations',
      description: 'List three recommendations based on the context.',
      parameters: z.object({
        response: z.string().describe('The response to the user in the users language'),
        recommendations: z.array(z.object({
          docId: z.string().describe('The value of <doc_id>'),
          title: z.string().describe('The title of the recommendation in the users language'),
          // description: z.string().describe('The description of the recommendation'),
          // imageUrl: z.string().describe('The image url of the recommendation'),
          // address: z.string().describe('The address of the place'),
          // mapsUrl: z.string().describe('The maps url of the place'),
          // bookingUrl: z.string().optional().describe('The booking url of the place'),
        })),
      }),
    }], temperature: 0,
  });

  completion.onTextContent((content: string, isFinal: boolean) => {
    const MarkdownWithLink = ({ content }) => {
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

  completion.onFunctionCall('get_recommendations', async ({ recommendations, response }) => {
    reply.update(<BotCard>
      <StocksSkeleton />
    </BotCard>);

    const { data } = await supabase.from('documents').select('id, mapsUrl, address, images').in('id', recommendations.map((r: {
      docId: string;
    }) => r.docId));

    console.log('recommendations', recommendations);
    console.log('data', data);
    const recommendationData = recommendations.map((rec) => {
      const docData = data?.find((doc: { id: string; mapsUrl: string }) => doc.id === Number(rec.docId));
      return {
        title: rec?.title,
        address: docData?.address,
        mapsUrl: docData?.mapsUrl,
        images: docData?.images,
      };
    });

    // console.log('recommendationData', recommendationData);
    reply.done(<BotCard>
      <Recommendations response={response} recommendations={recommendationData} />
    </BotCard>);

    aiState.done([...aiState.get(), {
      role: 'function', name: 'get_recommendations', content: JSON.stringify(recommendations),
    }]);
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
  id: number; display: React.ReactNode;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage, confirmPurchase,
  }, initialUIState, initialAIState,
});
