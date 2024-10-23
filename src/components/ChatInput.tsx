import { useState, RefObject } from 'react';
import Textarea from 'react-textarea-autosize';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IconArrowElbow, IconPlus } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import Link from "next/link";

interface ChatInputProps {
  disabled?: boolean;
  onSubmit: (value: string) => void;
  formRef: RefObject<HTMLFormElement>;
  inputRef: RefObject<HTMLTextAreaElement>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function ChatInput({ onSubmit, formRef, inputRef, onKeyDown, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputValue);
    setInputValue('');
  };

  return (
    <div className="fixed inset-x-0 bottom-0 w-full from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <div className="mx-auto sm:max-w-2xl">
        <div className="px-4 py-2 space-y-4 border-t border-t-peachDark shadow-lg bg-peachLight md:py-4">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
          >
            <div className="relative flex flex-col w-full px-10 overflow-hidden max-h-60 grow bg-peachLight rounded-md border px-12">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    variant="outline"
                    size="icon"
                    className="absolute left-0 w-8 h-8 p-0 rounded-full top-4 left-4"
                    onClick={e => {
                      e.preventDefault();
                      window.location.reload();
                    }}
                  >
                    <IconPlus/>
                    <span className="sr-only">Ny Chat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ny Chat</TooltipContent>
              </Tooltip>
              <Textarea
                disabled={disabled}
                ref={inputRef}
                tabIndex={0}
                onKeyDown={onKeyDown}
                placeholder="Spør meg her"
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
              <div className="absolute right-0 right-4 md:right-4 lg:right-4 top-4">
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
              </div>
            </div>
            <p className=" text-xs pt-2 text-center text-gray-600">
              Vår AI kan gi unøyaktig informasjon og/eller det kan ha blitt endret. Derfor er det alltid lurt å
              undersøke aktuelt steds priser, åpningstider o.l.
              <Link href="https://meravoslo.no/chat-terms-service" target="_blank"> Vår <span className="underline"> vilkår-tjeneste</span></Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
