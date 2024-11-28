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
import { TabName } from "@/lib/types";

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

  const [containerRef, endRef] = useScrollToBottom<HTMLDivElement>(messages.length);
  const emptyScreenTitle = TabName.ACTIVITIES === name ?
    'Spør meg om anbefalinger for aktiviteter i Oslo!  Basert på innholdet vårt vil jeg gi deg de beste tipsene.' :
    'Spør meg om anbefalinger for mat og drikke i Oslo!  Basert på innholdet vårt vil jeg svare deg så godt jeg kan.';

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
    <div className="h-dvh">
      <div>
        <div
          ref={containerRef}
          className="h-full bg-peachLight"
        >
          {filteredMessages.length ? (
            <>
              <ChatList messages={filteredMessages}/>
            </>
          ) : (
            <EmptyScreen
              selectedTab={name}
              title={emptyScreenTitle}
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
        </div>
        <div
          id="chat-list-end"
          ref={endRef}
          className="shrink-0 min-w-[48px] min-h-[48px]"
        />
        {isLimitReached ? (
          <div
            className="bg-peachLight fixed inset-x-0 bottom-0 w-full ">
            <div className="text-center mb-6">
              <div className="mb-6">
                <Separator/>
              </div>
              <p className="mb-4">Denne samtalen har nådd sin grense.</p>
              <Button
                onClick={handleNewChat}
              >
                Start ny chat
              </Button>
            </div>
          </div>
        ) : (
          <ChatInput
            onChatReset={() => handleNewChat()}
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
