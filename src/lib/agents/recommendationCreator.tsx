import OpenAI from "openai";

import { wrapOpenAI } from "langsmith/wrappers";
import { traceable } from "langsmith/traceable";
import { searchDocs } from "@/lib/db";

const openai = wrapOpenAI(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}));

const retriever = traceable(
  async function retriever(query: string) {
    return searchDocs(query);
  },
  { run_type: "retriever" }
);

export const recommendationCreator = traceable(async function rag(context: string, userQuestion: string, aiState: any) {
  await retriever(userQuestion);

  try {
    const prompt = `
      Please return recommendations based on the context and chat history. Call \\get_recommendations\\ function.
  
      Guidelines:
      Answer the question based only on the following context and user question:
      Context: <context> ${context} </context>.
      User Question: <userQuestion> ${userQuestion} </userQuestion>.
    `;

    const messages = [
      {
        role: "system",
        content: `You are a knowledgeable Norwegian culture, food, restaurant, travel assistant.`
      },
      {
        role: "user",
        content: prompt,
      }, ...aiState.get().map((info: any) => ({
        role: info.role, content: info.content, name: info.name
      }))];

    const tools = [
      {
        type: "function",
        function: {
          name: "get_recommendations",
          description: `Create up to three recommendations based on the context number of <restaurant>. So if there is only one <restaurant> in the context, return only one recommendation, etc.`,
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: `A title for the recommendations in the users language. The title is about introducing the recommendations.  Use tone of voice from the provided <context>. If we don't have information in <context> about specific details user ask, please mention this in the response `,
              },
              recommendations: {
                type: "array",
                description: `List of three recommendations.`,
                items: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                      description: `Short summary of the recommendation, write two sentences. Use tone of voice from the provided <context>. Explain why this is a good recommendation for user question.`,
                    },
                    id: {
                      type: "string",
                      description: `The value of <doc_id>.`,
                    },
                  },
                },
              },
            },
            required: ["get_recommendations"],
          },
        },
      },
    ];

    // @ts-ignore
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      temperature: 0.5,
      max_tokens: 4000,
      tool_choice: "auto", // auto is default, but we'll be explicit
    });
    const responseMessage = response.choices[0].message;

    // console.log("responseMessage", responseMessage)
    if (responseMessage.tool_calls) {
      return JSON.parse(responseMessage?.tool_calls?.[0]?.function?.arguments)
    }
    return null;
  } catch
    (error) {
    throw error;
  }
});
