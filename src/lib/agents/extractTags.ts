import { openai } from "@/lib/models";
import { generateText } from 'ai';
import { supabase } from "@/lib/supabase/backend";

export async function extractTags(question: string) {
  const { data: tags } = await supabase.from("tags").select("name");

  const prompt = `
  Follow these rules strictly:
  1. Only return tags from the available tags list.
  2. Return tags as a JSON array.
  3. If the user question is unclear or irrelevant to the available tags, return an empty array [].
  4. For questions about romantic places, return "restaurant" or "venueType:wine_bar".
  5. Only return "pricing:cheap_food" or "pricing:cheap_beer" if explicitly asked for, e.g., "cheap food in oslo" or "cheap beer in oslo".
  6. Match language variations: e.g., "lunsj" (Norwegian) should match "lunch".
  7. Consider context: e.g., lunch-related queries should match relevant food types and "restaurant" or "cafe".
  8. If multiple food types are mentioned, include all relevant tags.
  9. For activity-related queries, include relevant activity tags.
  10. User might write question in different language than English, make sure you translate the user question first and than extract the tags.
  
  Available tags:
  [${tags?.map(t => t.name).join(", ")}]
  
  # Example Interactions
  User: "lunsj i oslo?"
  Assistant: ["venueType:restaurant", "venueType:cafe", "saturday_lunch"]
  
  User: "Romantic dinner with wine?"
  Assistant: ["venueType:restaurant", "atmosphere:romantic"]
  
  User: "Cheap beer in Oslo"
  Assistant: ["pricing:cheap_beer", "venueType:bar"]
  
  User: "Where can I find good pizza?"
  Assistant: ["venueType:restaurant", "food:pizza"]
  
  User: "Any fun activities for the weekend?"
  Assistant: ["activity:rafting", "activity:pottery", "activity:quiz"]
  
  User: "What's the weather like today?"
  Assistant: []
  
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
        "content": prompt
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
