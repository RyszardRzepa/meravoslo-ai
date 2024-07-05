import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";


// Initialize Vertex with your Cloud project and location
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_VERTEX_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.4,
  topK: 32,
  maxOutputTokens: 1000,
  responseMimeType: "text/plain",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

export async function getFilterParams(question: string) {
  const text = `As a helpful assistant, your task is to return a JSON response based on the user query.

Return a JSON object using the <data> parameters that align with the <user_query>.
If a user inquires about affordable food, set the priceFrom to 200.
For user inquiries about cheap drinks, set the priceFrom to 100.
Your output should solely be a JSON object. Only include <data> parameters that correspond with the user query.
Return empty object “{}” if user query don’t satisfy any <data> params.

<example_query_and_response>
User Query: Where can I go for a romantic date with vegan options?
Response: { "romanticScale":  “Romantic”, "hasVegan": true }
<example_query_and_response>

<data> {
  {
  district: {
    type: "string",
    description: "Include this if user is asking for a city district only, if user mention only city name, don't include this. “If user say downtown, return “Centrum”.,
  },
  romanticScale: {
    type: "string",
    description: "Include this if the user is looking for a romantic setting like a date. Possible values: ['Romantic', 'Not romantic']",
  },
  hasVegetarian: {
    type: "boolean",
    description: "Include this if the user is seeking vegetarian options. Possible values: [true, false]",
  },
  hasVegan: {
    type: "boolean",
    description: "Include this if the user is seeking vegan options. Possible values: [true, false]",
  },
  priceFrom: {
    type: "number",
    description: "Include this if the user asks for a specific price point. This is a number.",
  },
  foodType: {
    type: "string",
    description: "The type of food served at the restaurant. Possible values: [
    'Italian', 
    'French', 
    'Asian', 
    'Indian', 
    'Chinese', 
    'American', 
    'Mediterranean', 
    'Nordic', 
    'Other', 
    'Mexican', 
    'Japanese', 
    'Korean', 
    'Thai', 
    'Spanish', 
    'Middle Eastern', 
    'African', 
    'Caribbean', 
    'Greek', 
    'Turkish', 
    'Vietnamese', 
    'Lebanese', 
    'Brazilian', 
    'Peruvian', 
    'Ethiopian'
]"},
 placeCategory: {
	type: “string”,
Description: “The category of the place. Select only one of the possible values: ['Pub/Bar og restaurant', 'Restaurant', 'Vinbar og restaurant', 'Kafé’]. If user ask for a romantic place, select “Restaurant”, if user ask for food recommendation or dinning out also select “Restaurant”.
 },
“day”: {
type: “string”,
Description: ”The day and of the week. Example “Manday”
}
  }
<data>

<user_query>
${question}
<user_query>
`

  const chatSession = model.startChat({
    generationConfig,
    safetySettings,
    history: [],
  });

  const result = await chatSession.sendMessage(text);
  return JSON.parse(result.response.text())
}
