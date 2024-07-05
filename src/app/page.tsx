'use client';

import { useEffect, useRef, useState } from 'react';
import Textarea from 'react-textarea-autosize';

import { useUIState, useActions } from 'ai/rsc';
import { UserMessage } from '@/components/llm-stocks/message';
import { type AI } from './actions/ai';
import { ChatScrollAnchor } from '@/lib/hooks/chat-scroll-anchor';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconArrowElbow, IconClose, IconFilter, IconPlus } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { ChatList } from '@/components/chat-list';
import { EmptyScreen } from '@/components/empty-screen';
import { supabaseFrontent } from "@/lib/supabase/frontend";
import { saveMessage } from "@/app/actions/db";
import { Role } from "@/lib/types";
import { expandChat } from "@/lib/utils";
import Filter from "@/components/filter";

const threadId = new Date().getTime();

export default function Page() {
  const [filters, setFilters] = useState({
    priceRange: [1, 4],
    cuisines: {
      Norwegian: false,
      Italian: false,
      Asian: false,
      Vegetarian: false,
    },
    rating: 1,
  });
  const [messages, setMessages] = useUIState<typeof AI>();
  const [showFilters, setShowFilters] = useState(false);

  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState('');
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [uid, setUid] = useState<string | null>(null);
  const divRef = useRef(null);

  useEffect(() => {
    const login = async () => {
      const { data } = await supabaseFrontent.auth.getSession();
      if (!data.session) {
        const { data, error } = await supabaseFrontent.auth.signInAnonymously()
        if (data) {
          setUid(data?.user?.id!)
        }
        return
      }
      setUid(data.session.user.id)
    }
    login()
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        if (
          e.target &&
          ['INPUT', 'TEXTAREA'].includes((e.target as any).nodeName)
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef]);

  const removeFilter = (filterType) => {
    if (filterType === 'priceRange') {
      setFilters(prev => ({ ...prev, priceRange: [1, 4] }));
    } else if (filterType === 'cuisines') {
      setFilters(prev => ({ ...prev, cuisines: Object.fromEntries(Object.entries(prev.cuisines).map(([key, _]) => [key, false])) }));
    } else if (filterType === 'rating') {
      setFilters(prev => ({ ...prev, rating: 1 }));
    }
  };

  const getActiveFilters = (filters) => {
    const activeFilters = [];

    if (filters.priceRange[0] > 1 || filters.priceRange[1] < 4) {
      activeFilters.push({
        type: 'priceRange',
        label: `${'$'.repeat(filters.priceRange[0])} - ${'$'.repeat(filters.priceRange[1])}`
      });
    }

    const activeCuisines = Object.entries(filters.cuisines)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    if (activeCuisines.length > 0) {
      activeFilters.push({ type: 'cuisines', label: activeCuisines.join(', ') });
    }

    if (filters.rating > 1) {
      activeFilters.push({ type: 'rating', label: `${filters.rating}+ Stars` });
    }

    return activeFilters;
  };

  return (
    <div ref={divRef} id="chat-container" className="p-4">
      <div className="h-full">
        <div className="pt-4">
          {messages.length ? (
            <ChatList messages={messages}/>
          ) : (
            <EmptyScreen
              submitMessage={async message => {
                const id = Date.now();

                saveMessage({ message, role: Role.User, uid: uid!, threadId });

                // Add user message UI
                setMessages(currentMessages => [
                  ...currentMessages,
                  {
                    id,
                    display: <UserMessage>{message}</UserMessage>,
                  },
                ]);

                // Submit and get response message
                const responseMessage = await submitUserMessage({
                  content: message,
                  uid: uid!,
                  threadId,
                });

                setMessages(currentMessages => [
                  ...currentMessages,
                  responseMessage,
                ]);
              }}
            />
          )}

          <ChatScrollAnchor trackVisibility={false}/>
        </div>
      </div>

      <div id="chat-list-end" />

      <div
        className="fixed inset-x-0 bottom-0 w-full  from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
        {getActiveFilters(filters).length > 0 && (
          <div className="ml-4 overflow-x-auto whitespace-nowrap">
            {getActiveFilters(filters).map((filter, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="mr-2 mb-2"
                onClick={() => removeFilter(filter.type)}
              >
                {filter.label} <IconClose />
              </Button>
            ))}
          </div>
        )}
        <div className="mx-auto sm:max-w-2xl sm:px-4">
          <div className="px-4 py-2 space-y-4 border-t border-t-peachDark shadow-lg bg-peachLight md:py-4">
            <form
              ref={formRef}
              onSubmit={async (e: any) => {
                e.preventDefault();

                // Blur focus on mobile
                if (window.innerWidth < 600) {
                  e.target['message']?.blur();
                }

                const value = inputValue.trim();
                setInputValue('');
                if (!value) return;

                saveMessage({ message: value, role: Role.User, uid: uid!, threadId });

                // Add user message UI
                setMessages(currentMessages => [
                  ...currentMessages,
                  {
                    id: Date.now(),
                    display: <UserMessage>{value}</UserMessage>,
                  },
                ]);

                try {
                  // Submit and get response message
                  const responseMessage = await submitUserMessage({
                    threadId,
                    uid: uid!,
                    content: value,
                  });

                  setMessages(currentMessages => [
                    ...currentMessages,
                    responseMessage,
                  ]);

                  // Navigate to the end of the chat
                  expandChat();
                  // const element = document.getElementById('chat-list');
                  // element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } catch (error) {
                  // You may want to show a toast or trigger an error state.
                  console.error(error);
                }
              }}
            >
              <div
                className="relative flex flex-col w-full px-10 overflow-hidden max-h-60 grow bg-peachLight sm:rounded-md sm:border sm:px-12">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-0 w-8 h-8 p-0 rounded-full top-4 bg-background sm:left-4"
                      onClick={e => {
                        e.preventDefault();
                        window.location.reload();
                      }}
                    >
                      <IconPlus/>
                      <span className="sr-only">New Chat</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New Chat</TooltipContent>
                </Tooltip>
                <Textarea
                  ref={inputRef}
                  tabIndex={0}
                  onKeyDown={onKeyDown}
                  placeholder="Send a message."
                  className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  name="message"
                  rows={1}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                />
                <div className="absolute right-0 sm:right-4 md:right-4 lg:right-4 top-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        size="icon"
                        disabled={inputValue === ''}
                      >
                        <IconArrowElbow/>
                        <span className="sr-only">Send message</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>

                  {/*<Filter filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} open={showFilters}/>*/}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
