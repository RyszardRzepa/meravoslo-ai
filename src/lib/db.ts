import { embed, Embedding } from 'ai';
import { openai } from "@/lib/models";
import { supabase } from "@/lib/supabase/backend";

export type Business = {
  id: number;
  name: string;
  address: string,
  mapsUrl: string,
  bookingUrl: string,
  websiteUrl: string,
  menuText: string,
  district: string,
  articleUrl: string,
  openingHours: string,
  tags: string[],
  articleContent: string,
  images : Array<{ url: string, alt: string }>,
}

type BusinessByTags =  {
  matched_tags: string[],
  searched_tags: string[],
  articleTitle: string,
  articleUrl: string,
  articleContent: string,
} & Business

export async function createEmbedding(text: string) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

export async function vectorSearchPlaces(embedding: Embedding) {
  const { error: matchError, data } = await supabase.rpc('vector_search_places', {
    query_embedding: embedding, match_threshold: 0.4, match_count: 2,
  });

  // filter out the documents that have the same restaurant id
  const uniqueIds = new Set();
  const filteredData = data.filter((b: Business) => {
    if (uniqueIds.has(b.id)) {
      return false;
    }
    uniqueIds.add(b.id);
    return true;
  });

  let context = "<tableName>places</tableName>\n";

  filteredData.map((doc: Business) => {
    context += `<place>
                Activity Name: ${doc.name}. 
                About: ${doc.articleContent}. 
                <place_id>${doc?.id}</place_id>.
              </<place>\n`;
  });

  return context
}

export async function vectorSearchActivities(embedding: Embedding) {
  const { error: matchError, data } = await supabase.rpc('vector_search_activities', {
    query_embedding: embedding, match_threshold: 0.4, match_count: 2,
  });

  const uniqueIds = new Set();
  const filteredData = data.filter((b: Business) => {
    if (uniqueIds.has(b.id)) {
      return false;
    }
    uniqueIds.add(b.id);
    return true;
  });

  let context = "<tableName>activities</tableName>\n";

  filteredData.map((doc: Business) => {
    context += `<activity>
                Activity Name: ${doc.name}. 
                About: ${doc.articleContent}. 
                <activity_id>${doc?.id}</activity_id>.
              </<activity>\n`;
  });

  return context
}

export async function searchPlacesByTags(tags: string[]): Promise<BusinessByTags[]> {
  const { data, error } = await supabase
    .rpc('places_recursive_tag_search', { initial_tags: tags })
  return data
}

export async function searchActivitiesByTags(tags: string[]): Promise<BusinessByTags[]> {
  const { data, error } = await supabase
    .rpc('activities_recursive_tag_search', { initial_tags: tags })
  return data
}
