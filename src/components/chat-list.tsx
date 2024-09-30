'use client';

import { useEffect, useRef, useState } from "react";

export function ChatList({ messages }: { messages: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);

  useEffect(() => {
    if (messages.length > prevMessagesLength && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    setPrevMessagesLength(messages.length);
  }, [messages, prevMessagesLength]);

  if (!messages.length) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative max-w-2xl mb-32 overflow-y-auto max-h-[calc(100vh-200px)]">
      {messages.map((message, index) => (
        <div
          key={index}
          className="mb-4"
        >
          {message.display}
        </div>
      ))}
    </div>
  );
}
