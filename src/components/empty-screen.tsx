import { Button } from '@/components/ui/button';
import { ExternalLink } from '@/components/external-link';
import { IconArrowRight } from '@/components/ui/icons';

const exampleMessages = [
  {
    heading: 'Vi er fire venner som vil spise godt og drikke billig i kveld. Hvor bør vi gå?',
    message: 'Vi er fire venner som vil spise godt og drikke billig i kveld. Hvor bør vi gå?',
  },
  {
    heading: 'Hvor kan jeg gå for en romantisk date?',
    message: 'Hvor kan jeg gå for en romantisk date?',
  },
  {
    heading: 'Hvor er beste indisk i Oslo?',
    message: 'Hvor er beste indisk i Oslo?',
  },
  {
    heading: 'Hvilke restauranter er ledig i kveld kl 18:00 med 6 personer?',
    message: 'Hvilke restauranter er ledig i kveld kl 18:00 med 6 personer?',
  },
];

export function EmptyScreen({
                              submitMessage,
                            }: {
  submitMessage: (message: string) => void;
}) {
  return (
    <div className="mx-auto px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Testing prompts
        </h1>
        <p className="leading-normal text-muted-foreground">Try an example:</p>
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base text-left"
              onClick={async () => {
                submitMessage(message.message);
              }}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
