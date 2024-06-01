import { createClient } from "@supabase/supabase-js";
import OpenAI, { OpenAI as OpenAIEmbeddings } from "openai";
import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql as sqlPG } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from 'drizzle-orm';

type Document = {
  id: string;
  content: string;
  title: string;
  summary: string;
  tags: string[];
  menu: string;
  restaurant: string;
}

export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PRIVATE_KEY!);

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function createEmbedding(text: string) {
  const openai = new OpenAIEmbeddings();
  const {
    data: [{ embedding }],
  } = await openai.embeddings.create({
    model: 'text-embedding-3-small', input: text, dimensions: 1536, // Generate an embedding with 1536 dimensions
  });
  return embedding;
}

const combineDocumentsFn = (docs: Document[]) => {
  const serializedDocs = docs.map((doc) => {
    return `<restaurant>
                Title: ${doc.title} 
                About: ${doc.summary}. 
                <doc_id>${doc?.id}</doc_id>
                <res_id>${doc?.restaurant}</res_id>
              </<restaurant>`;
  });
  return serializedDocs.join('\n\n');
};

export async function searchDocs(message: string) {
  const embedding = await createEmbedding(message);

  const { error: matchError, data } = await supabase.rpc('match_documents_no_metadata', {
    query_embedding: embedding, match_threshold: 0.3, match_count: 3,
  });

  // filter out the documents that have the same restaurant id
  const restaurantIds = new Set();
  const filteredData = data.filter((doc: Document) => {
    if (restaurantIds.has(doc.restaurant)) {
      return false;
    }
    restaurantIds.add(doc.restaurant);
    return true;
  });

  return combineDocumentsFn(filteredData);
}

type SearchRestaurantParams = {
  district: string | null;
  romanticScale: string | null;
  hasVegetarian: boolean | null;
  priceFrom: number | null;
  foodType: string | null;
  category: string | null;
  openingHours: string | null;
  hasVegan: boolean | null;
}

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  email: text('email'),
});

function prepareFetchDocumentsSimilarParams(params: SearchRestaurantParams) {
  const {
    district,
    romanticScale,
    hasVegetarian,
    priceFrom,
    foodType,
    category,
    openingHours,
    hasVegan,
  } = params;

  return [
    district ?? null,
    romanticScale ?? null,
    hasVegetarian ?? null,
    priceFrom ?? null,
    foodType ?? null,
    category ?? null,
    openingHours ?? null,
    hasVegan ?? null,
  ];
}
export async function searchRestaurants(params: SearchRestaurantParams) {
  const db = drizzle(sqlPG)
  const allUsers = await db.select().from(bookings);
  const preparedParams = prepareFetchDocumentsSimilarParams(params);

  const result = await db.execute(sql`SELECT * FROM fetch_documents_similar(
    ${preparedParams[0]},
    ${preparedParams[1]},
    ${preparedParams[2]},
    ${preparedParams[3]},
    ${preparedParams[4]},
    ${preparedParams[5]},
    ${preparedParams[6]},
    ${preparedParams[7]}
  );`)

  return result.rows;
}
