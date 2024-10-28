import { useEffect, useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(
  dependency: any
): [RefObject<T>, RefObject<T>] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const end = endRef.current;

    if (end) {
      end.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [dependency]);

  return [containerRef, endRef];
}
