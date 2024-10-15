export function ChatList({ messages }: { messages: any[] }) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="pb-36">
      {messages.map((message, index) => (
        <div
          key={index}
          className="mb-4"
        >
          {message.display}
        </div>
      ))}
      <div id="chat-list-end" />
    </div>
  );
}
