import 'server-only';
import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { BotCard, BotMessage, spinner} from '@/components/llm-stocks';

import { runOpenAICompletion, sleep } from '@/lib/utils';
import { z } from 'zod';
import { StocksSkeleton } from '@/components/llm-stocks/stocks-skeleton';
import Recommendations from '@/components/recommendations';
import { openai, searchDocs, supabase } from "@/lib/db";
import BookingForm from "@/components/booking-form";

async function submitBookingState() {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  aiState.update([...aiState.get(), {
    role: 'system', content: 'Starting the booking process...', name: 'startBookingProcess',
  }]);

  const reply = createStreamableUI(<BotMessage>{spinner}</BotMessage>);

  reply.done(<BotCard>
    <div>Takk for Booking hos Maximus Trattoria 😋. Er det noe
      annet du lurer på?</div>
  </BotCard>);

  aiState.done([...aiState.get(), {
    role: 'system', name: 'startBookingProcess', content: 'Starting the booking process...',
  }]);

  return {
    id: Date.now(), display: reply.value,
  };
}

async function submitUserMessage(content: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  // const ads = await getAds(content); // search in ads table
  // Search for relevant docs
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
        title: z.string().describe('Short response to the user in the users language'),
        recommendations: z.array(z.object({
          docId: z.string().describe('The value of <doc_id>'),
          summary: z.string().describe('Short summary of the recommended place in the user language. Max 4 sentences.'),
        })),
      }),
    }], temperature: 0,
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

  completion.onFunctionCall('get_recommendations', async ({ recommendations, title }) => {
    reply.update(<BotCard>
      <StocksSkeleton />
    </BotCard>);

    const select = "id, mapsUrl, address, images, bookingUrl, district, businessName"
    const { data } = await supabase.from('documents').select(select).in('id', recommendations.map((r: {
      docId: string;
    }) => r.docId));

    const recommendationData = recommendations.map((rec) => {
      const docData = data?.find((doc: { id: number; mapsUrl: string }) => doc.id === Number(rec.docId));
      return {
        summary: rec?.summary,
        address: docData?.address,
        mapsUrl: docData?.mapsUrl,
        images: docData?.images,
        bookingUrl: docData?.bookingUrl,
        businessName: docData?.businessName,
        district: docData?.district,
      };
    });

    reply.done(<BotCard>
      <Recommendations title={title} data={recommendationData} />
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
    submitUserMessage,
    submitBookingState,
  }, initialUIState, initialAIState,
});
