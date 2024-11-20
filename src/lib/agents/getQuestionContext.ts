import { openai } from "@/lib/models";
import { generateObject } from 'ai';
import { supabase } from "@/lib/supabase/backend";
import { z } from 'zod';

export async function getQuestionContext(question: string, chatHistory: string) {
  const {data } = await supabase.from("prompts").select("text").eq("name", "getQuestionContext")

  const systemPrompt = `  
  ${data?.[0].text}. \n
  Chat History: <chat_history>${chatHistory}</chat_history>. \n
  User question: ${question}
  `

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      question: z.string(),
      isFollowUp: z.boolean(),
      isCorrectQuestion: z.boolean(),
    }),
    prompt: systemPrompt,
  });

  return object;
}
