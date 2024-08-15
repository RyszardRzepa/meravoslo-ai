'use server';

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/backend";

const image = z.object({
  url: z.string(),
  alt: z.string(),
});

const item = z.object({
  name: z.string(),
  articleTitle: z.string(),
  articleContent: z.string(),
  images: z.array(image),
  tags: z.array(z.string()),
  articleUrl: z.string(),
  address: z.string(),
  googleMapsUrl: z.string(),
  openingHours: z.string(),
  district: z.string(),
});

const Business = z.object({
  businesses: z.array(item),
});

const getUrlMarkdown = async (url: string) => {
  const fullUrl = 'https://r.jina.ai/' + url;
  const headers = {
    "X-Return-Format": "markdown",
      "X-Wait-For-Selector": "Main-content",
      "X-Target-Selector": "#Main-content"
  }

  return fetch(fullUrl, { headers })
    .then(response => {
      return response.text();
    })
}

const runCompletation = async (markdown: string) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { data } = await supabase.from("tags").select("name");
  const tags = data?.map(tag => tag.name) ?? []

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    // model: "gpt-4o-mini",
    max_tokens: 10000,
    messages: [
      { role: "system", content: "You are professional data extraction assistant." },
      {
        role: "user", content: `Please extract all restaurant/business data from the provided <markdown> content. The output should be in Norwegian.

Instructions:
Multiple Entries: If the <markdown> contains information about multiple restaurants/businesses, extract and return all of them. Ensure that only unique entries are included—no duplicates.
Data Fields:
- name: The name of the restaurant or business.
- articleTitle: The full title of the article.
- articleContent: The entire text content of the article.
- images: An array of images with image url and alt. Match images using the alt attribute corresponding to the restaurant/business name, and include these in the JSON response. If the alt is not available, return empty string for the alt.
- tags: An array of tags relevant to the restaurant/business based on the <available_tags>.
- address: The address of the restaurant/business.
- googleMapsUrl: The Google Maps URL of the restaurant/business.
- openingHours: The opening hours of the restaurant/business if exist. 
- district: The district of the restaurant/business based on the address in the <markdown>.
Make sure you extract images and tags for each restaurant/business if existing in the <markdown>.
Make sure to extract image alt text. Don't write in alt image numbers example "Image 24". Return only alt text that exist in <markdown>.
Tags to choose from:
<available_tags>
[${tags.map((tag) => tag).join(", ")}]
</available_tags>.
Use only tags that exist in <available_tags>.

<markdown>${markdown}</markdown>`
      },
    ],
    response_format: zodResponseFormat(Business, "math_reasoning"),
  });

  return {
    businesses: completion.choices[0].message.parsed?.businesses.map(business => ({
      ...business,
      tags: business.tags.filter(tag => tags.includes(tag))
    })),
  };
}

const extractDataFromUrl = async (url: string) => {
  const markdown = await getUrlMarkdown(url);
  return await runCompletation(markdown);
}

export default extractDataFromUrl;
