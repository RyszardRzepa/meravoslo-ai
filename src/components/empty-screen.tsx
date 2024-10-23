import { Button } from '@/components/ui/button';
import { ExternalLink } from '@/components/external-link';
import { IconArrowRight } from '@/components/ui/icons';

export function EmptyScreen({
                              exampleMessages,
                              submitMessage,
                            }: {
  submitMessage: (message: string) => void;
  exampleMessages: { heading: string; message: string }[];
}) {
  return (
    <div className="">
      <div className="rounded-lg bg-peach p-8 border-peachDark border-2">
        <h1 className="mb-2 text-lg font-semibold">
          Hei! Hvordan kan jeg hjelpe deg i dag?
        </h1>
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="outline"
              className="bg-transparent shadow-neutral-50 h-auto text-base text-left border border-gray-300 py-2 px-4 rounded-full transition-all duration-200 hover:bg-peachDark hover:text-black focus:outline-none focus:ring-2 focus:ring-peachDark focus:ring-opacity-50"
              onClick={async () => {
                submitMessage(message.message);
              }}
            >
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>

  );
}
