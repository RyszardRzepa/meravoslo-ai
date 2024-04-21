'use server';

import { supabase } from "@/lib/db";

export async function saveBookingEmail({ email, bookingUrl, businessName }: {
  email: string;
  bookingUrl: string;
  businessName: string
}): Promise<number> {

  const { data, error } = await supabase.from('bookings').insert(
    { email, bookingUrl, businessName },
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
