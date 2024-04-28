import { createClient } from "@supabase/supabase-js";
import OpenAI, { OpenAI as OpenAIEmbeddings } from "openai";

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
    return `<content_start>
                Title: ${doc.title} 
                About: ${doc.summary}. 
                <doc_id>${doc?.id}</doc_id>
                <res_id>${doc?.restaurant}</res_id>
              </content_end>`;
  });
  return serializedDocs.join('\n\n');
};

export async function searchDocs(message: string) {
  const embedding = await createEmbedding(message);

  const { error: matchError, data } = await supabase.rpc('match_documents_no_metadata', {
    query_embedding: embedding, match_threshold: 0.1, match_count: 3,
  });

  return combineDocumentsFn(data);
}
