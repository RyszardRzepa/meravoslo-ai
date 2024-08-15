'use server';

import { supabase } from "@/lib/supabase/backend"
import { Role } from "@/lib/types";

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

export async function saveMessage({ role, message, uid, threadId }: {
  message: string;
  role: Role;
  uid: string;
  threadId: number;
}): Promise<void> {
  await supabase.from('messages').insert(
    { message, role, uid, threadId },
  ).select();
}
