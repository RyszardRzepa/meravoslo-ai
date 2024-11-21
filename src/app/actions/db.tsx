'use server';

import { supabase } from "@/lib/supabase/backend"
import { Role, SearchType } from "@/lib/types";
import { Business, createEmbedding } from "@/lib/db";

export async function saveBooking({ bookingUrl, businessName }: {
  bookingUrl: string;
  businessName: string
}): Promise<number> {

  const { data, error } = await supabase.from('bookings').insert(
    { bookingUrl, businessName },
  ).select()

  if (error) {
    throw error;
  }

  return data[0].id;
}

export async function saveMessage({ role, message, jsonResponse, userQuestionTags, completionType, uid, threadId, type }: {
  message?: string;
  jsonResponse?: Record<string, any>[];
  completionType?: string;
  userQuestionTags?: string[];
  type: SearchType;
  role: Role;
  uid: string;
  threadId: number;
  type?: SearchType;
}): Promise<void> {
  await supabase.from('messages').insert(
    { message, role, uid, threadId, jsonResponse, userQuestionTags, completionType , type },
  ).select();
}

export async function searchForPlaces(content: string) {
  const embedding = await createEmbedding(content)
  const { error: matchError, data } = await supabase.rpc('vector_search_places', {
    query_embedding: embedding, match_threshold: 0.2, match_count: 10,
  });

  const uniqueIds = new Set();
  return data.filter((b: Business) => {
    if (uniqueIds.has(b.articleUrl)) {
      return false;
    }
    uniqueIds.add(b.articleUrl);
    return true;
  });
}

export async function searchForActivities(content: string) {
  const embedding = await createEmbedding(content)
  const { error: matchError, data } = await supabase.rpc('vector_search_activities', {
    query_embedding: embedding, match_threshold: 0.2, match_count: 10,
  });

  const uniqueIds = new Set();
  return data.filter((b: Business) => {
    if (uniqueIds.has(b.articleUrl)) {
      return false;
    }
    uniqueIds.add(b.articleUrl);
    return true;
  });
}
