export function ChatList({ messages }: { messages: any[] }) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="pb-36 mt-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className="w-full mb-4 flex"
        >
          {message.display}
        </div>
      ))}
      <div id="chat-list-end" />
    </div>
  );
}
