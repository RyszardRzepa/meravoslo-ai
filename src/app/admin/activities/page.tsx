import EditableTable from "@/app/admin/components/editable-table";
import { TabName } from "@/lib/types";
import { supabase } from "@/lib/supabase/backend";

async function getData() {
  const {
    data,
    error
  } = await supabase.from("activities").select("id, name, articleTitle, articleContent, images, tags");
  return data
}

export default async function Activities() {
  const data = await getData();
  return (
    <div>
      {/*@ts-ignore*/}
      {data && <EditableTable name={TabName.ACTIVITIES} data={data}/>}
    </div>
  );
}
