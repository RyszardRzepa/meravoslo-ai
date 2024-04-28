import OpenAI from "openai";

export async function querySuggestor(question: string): Promise<string[] | null>{
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
      {
        role: "system",
        content: `As a professional web researcher, your task is to generate a set of three queries that explore the subject matter more deeply, building upon the initial query and the information uncovered in its search results.

    For instance, if the original query was "Starship's third test flight key milestones", your output should follow this format:

    "{
      "related": [
        "What were the primary objectives achieved during Starship's third test flight?",
        "What factors contributed to the ultimate outcome of Starship's third test flight?",
        "How will the results of the third test flight influence SpaceX's future development plans for Starship?"
      ]
    }"

    Aim to create queries that progressively delve into more specific aspects, implications, or adjacent topics related to the initial query. The goal is to anticipate the user's potential information needs and guide them towards a more comprehensive understanding of the subject matter.
    Please match the language of the response to the user's language. Always reply in the user language`
      },
      {
        role: "user",
        content: question,
      },
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "relatedQuestions",
          description: `Create three related queries based on the context. Respond in the user language.`,
          parameters: {
            type: "object",
            properties: {
              relatedQuestion: {
                type: "array",
                description: `List of related queries to the initial query. Add emojis to make it more engaging.`,
                items: {
                  type: "string",
                  description: `The related query to the initial question with emoji in the end.`,
                },
              },
            },
            required: ["relatedQuestion"],
          },
        },
      },
    ];

    // @ts-ignore
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messages,
      tools: tools,
      max_tokens: 2000,
      tool_choice: "auto", // auto is default, but we'll be explicit
    });
    const responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls) {
      return JSON.parse(responseMessage?.tool_calls?.[0]?.function?.arguments).relatedQuestion;
    }
    return null;
  } catch (error) {
    throw error;
  }
}
