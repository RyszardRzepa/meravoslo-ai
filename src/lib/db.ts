import { embed } from 'ai';
import { openai } from "@/lib/models";
import { supabase } from "@/lib/supabase/backend";

type Document = {
  id: string;
  content: string;
  title: string;
  summary: string;
  tags: string[];
  menu: string;
  restaurant: string;
}

export async function createEmbedding(text: string) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

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

  return filteredData.map((doc: Document) => {
    return `<restaurant>
                Title: ${doc.title} 
                About: ${doc.summary}. 
                <doc_id>${doc?.id}</doc_id>
                <res_id>${doc?.restaurant}</res_id>
              </<restaurant>`;
  });
}

export async function searchRestaurantsByTags(tags: string[]) {
  const { data, error } = await supabase
    .rpc('restaurant_tag_search', { initial_tags: tags })
  return data
}
