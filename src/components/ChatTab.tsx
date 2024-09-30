import { useRef } from 'react';
import { useUIState, useActions } from 'ai/rsc';
import { UserMessage } from '@/components/message';
import { type AI } from '../app/actions/ai';
import { ChatScrollAnchor } from '@/lib/hooks/chat-scroll-anchor';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { ChatList } from '@/components/chat-list';
import { EmptyScreen } from '@/components/empty-screen';
import { expandChat } from "@/lib/utils";
import ChatInput from '@/components/ChatInput';

interface ChatTabProps {
  uid: string | null;
  threadId: number;
  exampleMessages: Array<{ heading: string; message: string }>;
  name: string;
}

export default function ChatTab({ uid, threadId, exampleMessages, name }: ChatTabProps) {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || !uid) return;

    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: Date.now(),
        display: <UserMessage>{value}</UserMessage>,
        name
      },
    ]);

    const responseMessage = await submitUserMessage({
      threadId,
      uid,
      content: value,
      name
    });

    setMessages(currentMessages => [
      ...currentMessages,
      responseMessage,
    ]);

    expandChat();
  };

  const filteredMessages = messages.filter(message => message.name === name);

  return (
    <div>
      <div>
        {filteredMessages.length ? (
          <ChatList messages={filteredMessages}/>
        ) : (
          <EmptyScreen
            exampleMessages={exampleMessages}
            submitMessage={async message => {
              const id = Date.now();
              setMessages(currentMessages => [
                ...currentMessages,
                {
                  id,
                  display: <UserMessage>{message}</UserMessage>,
                  name,
                },
              ]);

              const responseMessage = await submitUserMessage({
                content: message,
                uid: uid!,
                threadId,
                name,
              });

              setMessages(currentMessages => [
                ...currentMessages,
                responseMessage,
              ]);
            }}
          />
        )}
        {/*<ChatScrollAnchor trackVisibility={true}/>*/}
      </div>
      <ChatInput
        onSubmit={handleSubmit}
        formRef={formRef}
        inputRef={inputRef}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
