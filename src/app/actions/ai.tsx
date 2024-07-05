import 'server-only';
import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import { BotCard, BotMessage, spinner } from '@/components/llm-stocks';

import { runAsyncFnWithoutBlocking } from '@/lib/utils';
import { Skeleton } from '@/components/llm-stocks/stocks-skeleton';
import { handleDefaultResponse } from "@/app/actions/lib";

async function submitBookingState(restaurantName: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  //TODO
  // How to use filters here? Do I set filters based on the response? Set in url params?
  // Show active filters over the search bar?
  // User can use filters to fetch data
  // If user ask AI first and start using filters, How to check what filters were applied?
  // Return columns data that we use for filters?
  // How do we apply the ai response to the new filters? We need to run AI for each filter change?


  // User ask Ai
  // show response and the applied filters
  // user change filter. We update the UI to show new results based on the new filters.
  // we update the ui state.

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

    handleDefaultResponse({
      aiState, reply, userQuestion: content, query: content, uid, threadId
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
