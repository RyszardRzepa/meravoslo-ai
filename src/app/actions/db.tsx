'use server';

import { supabase } from "@/lib/db";
import { Role } from "@/lib/types";
import { supabaseBackend } from "@/lib/supabase/backend";

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

export async function updateBooking({ id, data }: {
  id: number;
  data: Partial<{ email?: string; bookingUrl?: string; businessName?: string, bookingConfirmed?: boolean }>
}): Promise<void> {
  await supabase.from('bookings').update(data).match({ id });
}

export async function saveMessage({ role, message, uid, threadId }: {
  message: string;
  role: Role;
  uid: string;
  threadId: number;
}): Promise<void> {
  await supabaseBackend.from('messages').insert(
    { message, role, uid, threadId },
  ).select();
}
