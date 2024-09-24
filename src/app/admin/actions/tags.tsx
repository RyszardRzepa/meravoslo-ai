'use server'

import { supabase } from "@/lib/supabase/backend";

const addNewTag = async (tagName: string) => {
  const { error, data } = await supabase.from('tags').insert({ name: tagName })
  if (error) {
    throw error;
  }
  return data;
}

const updateTagById = async (tag: { id: number, name: string }) => {
  const { error, data } = await supabase.from('tags').update({ name: tag.name }).eq('id', tag.id)
  if (error) {
    throw error;
  }
  return data;
}

const getTags = async () => {
  const { data, error } = await supabase.from('tags').select('name,id');
  if (error) {
    throw error;
  }
  return data;
};

export  { addNewTag, updateTagById, getTags };
