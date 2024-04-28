import 'server-only';
import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { BotCard, BotMessage, spinner } from '@/components/llm-stocks';

import { runOpenAICompletion } from '@/lib/utils';
import { z } from 'zod';
import { Skeleton } from '@/components/llm-stocks/stocks-skeleton';
import Recommendations from '@/components/recommendations';
import { openai, searchDocs, supabase } from "@/lib/db";
import { querySuggestor } from "@/lib/agents/querySuggestor";
import { SuggestionCard } from "@/components/llm-stocks/message";
import { saveMessage } from "@/app/actions/db";
import { Role } from "@/lib/types";

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

  // const ads = await getAds(content); // search in ads table
  // Search for relevant docs
  const context = await searchDocs(content);

  aiState.update([...aiState.get(), {
    role: 'user', content,
  }]);

  const reply = createStreamableUI(<BotMessage className="items-center">{spinner}</BotMessage>);

  const completion = runOpenAICompletion(openai, {
    model: 'gpt-3.5-turbo-0125',
    stream: true,
    messages: [{
      role: 'system',
      content: `\
You are a knowledgeable Norwegian culture and travel assistant.
Respond in markdown format. Respond in the user's language. If unable to answer directly, provide a relevant recommendation instead based on the context.

Guidelines:
- If the user ask for recommendations to eat food, call \`get_recommendations\`. Example: "A place to eat for 6 ppl", "Romantic places for a date", etc.
- If user ask for address, map, or booking url, provide the information in the response in markdown format with the url.

Answer the question based only on the following context and chat history:
Context: <context> ${context} </context>
`,
    }, ...aiState.get().map((info: any) => ({
      role: info.role, content: info.content, name: info.name,
    }))],
    functions: [{
      name: 'get_recommendations',
      description: 'Create three recommendations based on the context.',
      parameters: z.object({
        title: z.string().describe('Short response to the user in the users language'),
        suggestions: z.array(z.string().describe('Suggestions for followup questions')),
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
        <MarkdownWithLink content={content}/>
    </BotMessage>);
    if (isFinal) {
      console.log("isFinal", content)
      saveMessage({ message: content, role: Role.Assistant, uid, threadId })
      reply.done();
      aiState.done([...aiState.get(), { role: 'assistant', content }]);
    }
  });

  completion.onFunctionCall('get_recommendations', async ({ recommendations, title, suggestions }) => {
    reply.update(<BotCard>
      <Skeleton />
    </BotCard>);

    saveMessage({ message: JSON.stringify(recommendations), role: Role.Assistant, uid, threadId })

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

    const querySuggestions = await querySuggestor(content)

    reply.done(
      <div className="flex flex-col gap-4">
        <BotCard>
          <Recommendations title={title} data={recommendationData}/>
        </BotCard>

        {querySuggestions && (
          <SuggestionCard
            showAvatar={false}
            suggestions={querySuggestions}
            threadId={threadId}
            uid={uid}
          />)}
      </div>
    );


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
  id: number; display: React.ReactNode; message?: string;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
    submitBookingState,
  }, initialUIState, initialAIState,
});
