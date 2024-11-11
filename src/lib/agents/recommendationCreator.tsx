import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const item = z.object({
  businessId: z.number(),
  content: z.string(),
});

const Recommendations = z.object({
  recommendations: z.array(item),
});

export const recommendationCreator = async (context: string, userQuestion: string, aiState: any) => {
  const completion = await openai.beta.chat.completions.parse({
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant designed to output JSON. Always return recommendations in the users language",
      },
      {
        role: "user", content: `Generate up to three restaurant recommendations based on the provided context and user question.

Use the number of restaurants mentioned in the context to control the number of recommendations: if there is only one restaurant mentioned, return only one recommendation, and similarly for two or three.

# Guidelines
- Extract details from the following fields in the input:
  - Context: \`<context> ${context} </context>\`
  - User Question: \`<userQuestion> ${userQuestion} </userQuestion>\`
  
- For each recommendation, provide:
  - \`businessId\`: Extracted from \`<place_id>\` inside the context.
  - \`content\`: A recommendation text tailored to the user's language, based on information from the \`userQuestion\` field.

- The maximum number of recommendations to return is 3. Make suggestions according to the available mentions in the context.

# Output Format

The response should be in JSON format. Include an array for recommendations, with a maximum of three entries, structured as follows:.
      `
      },
    ],
    model: "gpt-4o-mini",
    response_format: zodResponseFormat(Recommendations, "math_reasoning"),
  });

  try {
    return completion.choices[0].message.parsed;
  } catch (e) {
    console.error("Error parsing JSON", e);
  }
}
