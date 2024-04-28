import { createClient } from "@supabase/supabase-js";

const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3d3FwcWh5YWF5Y2tmemZzYWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEyOTE3NjAsImV4cCI6MjAyNjg2Nzc2MH0.qneRRoqGfR-es77beJOA_yE_IffMKJWEVEgmrTUhs20"
const url = "https://gwwqpqhyaayckfzfsale.supabase.co"
export const supabaseFrontent = createClient(url, anonKey);
