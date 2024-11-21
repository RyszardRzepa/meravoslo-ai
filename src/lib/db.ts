import { embed } from 'ai';
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
  openingHours: string,
  articleUrl: string,
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

export async function vectorSearchPlaces(message: string) {
  const embedding = await createEmbedding(message);

  const { error: matchError, data } = await supabase.rpc('vector_search_places', {
    query_embedding: embedding, match_threshold: 0.3, match_count: 6,
  });

  return data
}

export async function vectorSearchActivities(message: string) {
  const embedding = await createEmbedding(message);

  const { error: matchError, data } = await supabase.rpc('vector_search_activities', {
    query_embedding: embedding, match_threshold: 0.4, match_count: 6,
  });

  return data
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
