'use server';

import { createEmbedding } from "@/lib/db";
import { supabase } from "@/lib/supabase/backend";
import { Business } from "@/app/admin/types";

const insertRecord = async (record, embedding) => {
  // First, get the maximum ID from the table
  const { data: maxIdRecord, error: maxIdError } = await supabase
    .from('places')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .single()

  if (maxIdError) {
    console.error('Error fetching max ID:', maxIdError)
    return { error: maxIdError }
  }

  // Calculate the next ID
  const nextId = maxIdRecord ? maxIdRecord.id + 1 : 1

  // Now insert the new record with the calculated ID
  const { data, error } = await supabase
    .from('places')
    .insert({
      id: nextId,
      embedding,
      ...record
    })

  if (error) {
    console.error('Error inserting record:', error)
    return { error }
  }

  return { data }
}

const savePlacesInDb = async (data: Business[]) => {
  for (let record of data) {
    const { articleContent, name } = record;
    const embedding = await createEmbedding(articleContent);

    // Check if the record exist using name if yes update it
    // if not insert it
    const { error, data } = await supabase.from('places').select('name').eq('name', name)
    if (error) {
      return
    }

    if (data.length > 0) {
      // const { error, data } = await supabase.from('places').update({
      //   embedding,
      //   ...record
      // }).eq('name', name)
      // if (error) {
      //   throw error;
      // }
      console.log("place exist", name)
    } else {
      const { data: maxIdRecord, error: maxIdError } = await supabase
        .from('places')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single()

      if (maxIdError) {
        console.error('Error fetching max ID:', maxIdError)
        return { error: maxIdError }
      }

      // Calculate the next ID
      const nextId = maxIdRecord ? maxIdRecord.id + 1 : 1

      // Now insert the new record with the calculated ID
      const { data, error } = await supabase
        .from('places')
        .insert({
          id: nextId,
          embedding,
          ...record
        })

      if (error) {
        console.error('Error inserting record:', error)
        return { error }
      }
    }
  }
}

export default savePlacesInDb;
