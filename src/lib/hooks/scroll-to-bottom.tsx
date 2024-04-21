import { useCallback } from 'react';

const useScrollToBottom = () => {
  const scrollToBottom = useCallback(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return scrollToBottom;
};

export default useScrollToBottom;
