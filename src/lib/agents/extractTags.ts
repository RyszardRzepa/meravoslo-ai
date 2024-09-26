import { openai } from "@/lib/models";
import { generateText } from 'ai';
import { supabase } from "@/lib/supabase/backend";

function getCurrentSeason(): string {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const day = today.getDate(); // 1-31

  if ((month === 11 && day >= 21) || month < 2 || (month === 2 && day < 20)) {
    return "Winter";
  } else if (month < 5 || (month === 5 && day < 21)) {
    return "Spring";
  } else if (month < 8 || (month === 8 && day < 23)) {
    return "Summer";
  } else {
    return "Autumn";
  }
}

export async function extractTags(question: string) {
  const [tags, prompt] = await Promise.all([
    supabase.from("tags").select("name"),
    supabase.from("prompts").select("text").eq("name", "extractTags")
  ]);

  const enhancedPrompt = `
  ${prompt?.data?.[0].text}
  Available tags:
  [${tags?.data?.map(t => t.name).join(", ")}]
  User question: ${question}.
  Current season: ${getCurrentSeason()}
  `

  console.log("enhancedPrompt, enhancedPrompt", enhancedPrompt)

  const { text } = await generateText({
    model: openai('gpt-4o'),
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
