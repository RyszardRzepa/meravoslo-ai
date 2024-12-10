'use server';

import { createEmbedding } from "@/lib/db";
import { supabase } from "@/lib/supabase/backend";
import { Business } from "@/app/admin/types";

export const updateActivityInDb = async (record: Business) => {
  const { articleContent, name, id } = record;
  const embedding = await createEmbedding(articleContent);
  return await supabase.from('activities').update({
    embedding,
    ...record
  }).eq('id', id)
}

const saveActivityInDb = async (data: Business[]) => {
  for (let record of data) {
    const { articleContent, name, id = 0 } = record;
    const embedding = await createEmbedding(articleContent);

    // Check if the record exist using name if yes update it
    // if not insert it
  const { error, data } = await supabase.from('activities').select('id, name')
    .eq('id', id)

    console.log("error", error)
    if (error) {
      throw error;
    }

    if (data.length > 0) {
      console.log("update")
      await updateActivityInDb(record);
    } else {
      console.log("record", record)
      const { error, data } = await supabase.from('activities').insert({
        embedding,
        ...record
      })
      console.log("error", error)
      if (error) {
        throw error;
      }
    }
  }
}

export default saveActivityInDb;
