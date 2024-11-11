import EditableTable from "@/app/admin/components/editable-table";
import { TabName } from "@/lib/types";
import { supabase } from "@/lib/supabase/backend";

async function getData() {
  const { data } = await supabase.from("places").select("id, name, articleTitle, articleContent, images, tags, address");
  return data
}

export default async function Places() {
  const data = await getData();
  return (
    <div>
      {/*@ts-ignore*/}
      {data && <EditableTable name={TabName.EAT_DRINK} data={data}/>}
    </div>
  );
}
