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
    <div className="mx-auto">
      <div className="rounded-lg bg-peach p-8 border-peachDark border-2">
        <h1 className="mb-2 text-lg font-semibold">
          Hei! Hvordan kan jeg hjelpe deg i dag?
        </h1>
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto text-base text-left border border-gray-300 p-2"
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
