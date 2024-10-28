'use client';

import { IconAI, IconArrowRight } from '@/components/ui/icons';
import { cn, expandChat } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { useActions, useUIState } from "ai/rsc";
import type { AI } from "@/app/actions/ai";
import { saveMessage } from "@/app/actions/db";
import { Role } from "@/lib/types";

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative sm:flex gap-3 items-start justify-end w-full">
      <div
        className="w-fit mt-2 sm:mt-0 space-y-2 overflow-hidden rounded-full mx-6 p-4 bg-peach border border-peachDark">
        {children}
      </div>
    </div>
  );
}

export function BotMessage({
                             children,
                             className,
                           }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('group relative sm:flex gap-3 items-start', className)}>
    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-peach text-primary-foreground">
        <IconAI />
      </div>
      <div className="p-4 mt-2 sm:mt-0 flex-1 space-y-2 overflow-hidden rounded-md border border-peachDark">
        {children}
      </div>
    </div>
  );
}

export function BotCard({
                          children,
                          showAvatar = true,
}: {
  children: React.ReactNode;
  showAvatar?: boolean;
}) {
  return (
    <div className="group relative sm:flex gap-3 items-start w-full">
      <div
        className={cn(
          'ml-4 sm:ml-0 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border' +
          ' border-peachDark' +
          ' bg-peach text-primary-foreground',
          !showAvatar && 'invisible',
        )}
      >
        <IconAI />
      </div>
      <div className="mt-2 sm:mt-0 flex-1 space-y-2 overflow-hidden rounded-md p-4 border border-peachDark">{children}</div>
    </div>
  );
}

export function SuggestionCard({
                                 suggestions,
                                 showAvatar = true,
                                 threadId,
                                 uid,
                               }: {
  showAvatar?: boolean;
  suggestions: string[];
  uid: string;
  threadId: number;
}) {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();

  return (
    <div className="group relative sm:flex gap-3 items-start sm:mt-4">
      <div
        className={cn(
          'flex ml-8 shrink-0 select-none items-center justify-center rounded-full' +
          ' text-primary-foreground',
          !showAvatar && 'invisible',
        )}
      >
      </div>
      <div className="mt-2 sm:mt-0 flex-1 space-y-2 overflow-hidden rounded-md">
        <div className="flex flex-col items-start space-y-2 mb-4">
          {suggestions && suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-sm text-left text-gray-800"
              onClick={async () => {
                saveMessage({ message: suggestion, role: Role.User, uid, threadId });

                setMessages(currentMessages => [
                  // Remove the last message
                  ...currentMessages,
                  {
                    id: Date.now(),
                    display: <UserMessage>{suggestion}</UserMessage>,
                    message: suggestion,
                    name: 'User',
                  },
                ]);

                // Submit and get response message
                const responseMessage = await submitUserMessage({
                  content: suggestion,
                  uid,
                  threadId,
                  name: 'User',
                });

                setMessages(currentMessages => [
                  ...currentMessages,
                  responseMessage,
                ]);

                expandChat();
              }}
            >
              <IconArrowRight className="mr-2 text-muted-foreground"/>
              <p>{suggestion}</p>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'group relative sm:flex gap-3 items-start'
      }
    >
      <div className="mt-2 sm:mt-0 flex-1 space-y-2 overflow-hidden rounded-md p-4 bg-peach border border-peachDark">{children}</div>
    </div>
  );
}
