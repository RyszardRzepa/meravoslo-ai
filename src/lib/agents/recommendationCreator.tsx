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
        role: "user", content: `
      Please return recommendations based on the context and chat history.
      Guidelines:
      Create up to three recommendations based on the context number of <restaurant>. So if there is only one <restaurant> in the context, return only one recommendation, etc.
      Returned values:
      - businessId: you can find in context inside <doc_id>.
      - content: is the recommendation text in the users language that you can find by looking in the <userQuestion> value.
      Context: <context> ${context} </context>.
      User Question: <userQuestion> ${userQuestion} </userQuestion>.
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
