import { openai } from "@/lib/models";
import { generateObject } from 'ai';
import { supabase } from "@/lib/supabase/backend";
import { z } from 'zod';

type Context = {
  question: string;
  chatHistory: string;
  userQuestionHistory: string;
}

export async function getQuestionContext({ question, chatHistory, userQuestionHistory }: Context) {
  const {data } = await supabase.from("prompts").select("text").eq("name", "getQuestionContext")

  const systemPrompt = `  
  ${data?.[0].text}. \n
  User questions history: <user_questions_history>${userQuestionHistory}</user_questions_history>. \n
  Chat history: <chat_history>${chatHistory}</chat_history>. \n
  User question: ${question}
  `

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      question: z.string().describe('The rephrased question that the user asked'),
    }),
    prompt: systemPrompt,
  });

  return object;
}
