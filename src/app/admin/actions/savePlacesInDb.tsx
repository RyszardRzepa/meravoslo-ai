'use server';

import { createEmbedding } from "@/lib/db";
import { supabase } from "@/lib/supabase/backend";
import { Business } from "@/app/admin/types";

const savePlacesInDb = async (data: Business[]) => {
  for (let record of data) {
    const { articleContent, name } = record;
    const embedding = await createEmbedding(articleContent);

    // Check if the record exist using name if yes update it
    // if not insert it
    const { error, data } = await supabase.from('places').select('name').eq('name', name)
    if (error) {
      throw error;
    }

    if (data.length > 0) {
      const { error, data } = await supabase.from('places').update({
        embedding,
        ...record
      }).eq('name', name)
      if (error) {
        throw error;
      }
    } else {
      const { error, data } = await supabase.from('places').insert({
        embedding,
        ...record
      })
      if (error) {
        throw error;
      }
    }
  }
}

export default savePlacesInDb;
