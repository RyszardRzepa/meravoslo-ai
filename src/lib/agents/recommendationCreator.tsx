import OpenAI from "openai";
import { wrapOpenAI } from "langsmith/wrappers";
import { traceable } from "langsmith/traceable";

const openai = wrapOpenAI(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}));

export const recommendationCreator = traceable(async function rag(context: string, userQuestion: string, aiState: any) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant designed to output JSON. Always return recommendations in the users language",
      },
      {
        role: "user", content: `
      Please return recommendations based on the context and chat history.
      Return json format [{ 
      title: "A title for the recommendations in the users language. The title is about introducing the recommendations.  Use tone of voice from the provided <context>. If we don't have information in <context> about specific details user ask, please mention this in the response",
      recommendations: [{ summary: "Short summary of the recommendation, write two sentences. Use tone of voice from the provided <context>. Explain why this is a good recommendation for user question", id: "The value of <doc_id>" }] }]. 
  
      recommendations include all the restaurants in the context.
      Guidelines:
      Create up to three recommendations based on the context number of <restaurant>. So if there is only one <restaurant> in the context, return only one recommendation, etc.
      Context: <context> ${context} </context>.
      User Question: <userQuestion> ${userQuestion} </userQuestion>.
      `
      },
    ],
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
  });

  try {
    if (completion.choices[0].message.content) {
      return JSON.parse(completion.choices[0].message.content);
    }
    return null;
  } catch (e) {
    console.error("Error parsing JSON", e);
  }
});
