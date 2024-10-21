import { useRef, useState } from 'react';
import { useUIState, useActions } from 'ai/rsc';
import { UserMessage } from '@/components/message';
import { type AI } from '../app/actions/ai';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { ChatList } from '@/components/chat-list';
import { EmptyScreen } from '@/components/empty-screen';
import ChatInput from '@/components/ChatInput';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";

interface ChatTabProps {
  uid: string | null;
  threadId: number;
  exampleMessages: Array<{ heading: string; message: string }>;
  name: string;
}

const MESSAGE_LIMIT = 6;

export default function ChatTab({ uid, threadId, exampleMessages, name }: ChatTabProps) {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage, resetAIState } = useActions<typeof AI>();
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);

  const filteredMessages = messages.filter(message => message.name === name);

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const handleSubmit = async (value: string) => {
    if (!value.trim() || !uid || isLimitReached) return;

    setMessages(currentMessages => {
      const newMessages = [
        ...currentMessages,
        {
          id: Date.now(),
          display: <UserMessage>{value}</UserMessage>,
          name
        },
      ];
      checkMessageLimit(newMessages);
      return newMessages;
    });

    const responseMessage = await submitUserMessage({
      threadId,
      uid,
      content: value,
      name
    });

    setMessages(currentMessages => {
      const newMessages = [...currentMessages, responseMessage];
      checkMessageLimit(newMessages);
      return newMessages;
    });
  };

  const checkMessageLimit = (messages: any[]) => {
    const filteredMessages = messages.filter(message => message.name === name);
    setIsLimitReached(filteredMessages.length >= MESSAGE_LIMIT);
  };

  const handleNewChat = () => {
    setMessages(currentMessages => {
      const newMessages = currentMessages.filter(message => message.name !== name);
      return newMessages;
    });
    setIsLimitReached(false);
    resetAIState();
  };

  return (
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background">
      <div className="flex flex-col justify-between items-center gap-4">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 h-full w-dvw items-center overflow-y-scroll"
        >
          {filteredMessages.length ? (
            <>
              <ChatList messages={filteredMessages}/>
            </>
          ) : (
            <EmptyScreen
              exampleMessages={exampleMessages}
              submitMessage={async message => {
                const id = Date.now();
                setMessages(currentMessages => {
                  const newMessages = [
                    ...currentMessages,
                    {
                      id,
                      display: <UserMessage>{message}</UserMessage>,
                      name,
                    },
                  ];
                  checkMessageLimit(newMessages);
                  return newMessages;
                });

                const responseMessage = await submitUserMessage({
                  content: message,
                  uid: uid!,
                  threadId,
                  name,
                });

                setMessages(currentMessages => {
                  const newMessages = [...currentMessages, responseMessage];
                  checkMessageLimit(newMessages);
                  return newMessages;
                });
              }}
            />
          )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>
        {isLimitReached ? (
          <div className="text-center mb-8 mt-[-8rem]">
            <div className="mb-8">
            <Separator/>
          </div>
          <p className="mb-4">Denne samtalen har nådd sin grense.</p>
          <Button
            onClick={handleNewChat}
          >
            Start ny chat
          </Button>
        </div>
      ) : (
        <ChatInput
          onSubmit={handleSubmit}
          formRef={formRef}
          inputRef={inputRef}
          onKeyDown={onKeyDown}
          disabled={isLimitReached}
        />
      )}
      </div>
    </div>
  );
}
