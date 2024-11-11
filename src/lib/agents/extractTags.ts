import { openai } from "@/lib/models";
import { generateText, generateObject } from 'ai';
import { supabase } from "@/lib/supabase/backend";
import { z } from "zod";

function getCurrentSeason(): string {
  const today = new Date();
  const month = today.getMonth(); // 0-11

  if (month >= 4 && month <= 7) {
    return "Summer";
  } else if (month >= 8 && month <= 9) {
    return "Autumn";
  } else if (month >= 10 || month <= 1) {
    return "Winter";
  } else {
    return "Spring";
  }
}

export async function isActivity(question: string) {
  // Can I solve this in tags? So it the activity tag exist, call the activity agent?
  // How to handle followup questions? This could return empty value.
  // Add function to call food and activity agent?
  // run search for both places and activity?

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
        steps: z.array(z.string()),
      }),
    }),
    system: 'you can identify if user is asking for food-drink or activity',
    prompt: 'Return ',
  });
}


export async function extractTags(question: string) {
  const [tags, prompt] = await Promise.all([
    supabase.from("tags").select("name"),
    supabase.from("prompts").select("text").eq("name", "extractTags")
  ]);

  const promptContent = `
  ${prompt?.data?.[0].text}
  Available tags:
  [${tags?.data?.map(t => t.name).join(", ")}]
  Current season: ${getCurrentSeason()}.
  
  User question: ${question}
  `

  const { text } = await generateText({
    model: openai('gpt-4o'),
    messages: [
      {
        role: "user",
        content: `${promptContent}.`
      },
    ],
    temperature: 0,
    maxTokens: 1000,
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
