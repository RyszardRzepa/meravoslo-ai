import { openai } from "@/lib/models";
import { generateText } from 'ai';
import { supabase } from "@/lib/supabase/backend";

export async function extractTags(question: string) {
  const [tags, prompt] = await Promise.all([
    supabase.from("tags").select("name"),
    supabase.from("prompts").select("text").eq("name", "extractTags")
  ]);

  const enhancedPrompt = `
  ${prompt?.data?.[0].text}
  Available tags:
  [${tags?.data?.map(t => t.name).join(", ")}]
  User question: ${question}`

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        "role": "system",
        "content": "You are a tag extraction assistant. Your task is to analyze user questions and return tags from a predefined list that" +
          " are relevant to user question."
      },
      {
        "role": "user",
        "content": enhancedPrompt
      },
    ],
    temperature: 0,
    maxTokens: 500,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });

  let json: string[]

  try {
    // Remove json string formatting ``json``
    const content = text.replace(/```json\n/, '').replace(/\n```/, '');
    json = JSON.parse(content || '[]');
  } catch (e) {
    console.error('Error parsing OpenAI response:', e);
    json = [];
  }
  return json;
}
