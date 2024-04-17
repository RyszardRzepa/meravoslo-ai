import { Separator } from '@/components/ui/separator';

export function ChatList({ messages }: { messages: any[] }) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="relative max-w-2xl">
      {messages.map((message, index) => (
        <div key={index} className="pb-4">
          {message.display}
        </div>
      ))}
    </div>
  );
}
