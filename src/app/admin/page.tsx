import ScrapeDataForm from "@/app/admin/components/scrape-data-form";
import TagsTable from "@/app/admin/components/tags-tables";
import AuthWrapper from "@/app/admin/components/auth-wrapper";
import { getTags } from "@/app/admin/actions/tags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabName } from "@/lib/types";

const Admin = async () => {
  const tags = await getTags()
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    return null
  }

  return (
    <div className="w-full mx-auto p-12">
      <AuthWrapper>
        <Tabs defaultValue="places" className="w-full">
          <TabsList className="grid sm:max-w-72 grid-cols-2 bg-gray-200">
            <TabsTrigger value="places"
                         className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:bg-transparent">Places</TabsTrigger>
            <TabsTrigger value="activities"
                         className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:bg-transparent">Activities</TabsTrigger>
          </TabsList>
          <TabsContent value="places">
            <ScrapeDataForm name={TabName.EAT_DRINK}/>
          </TabsContent>
          <TabsContent value="activities">
            <div>Activities content goes here</div>
            <ScrapeDataForm name={TabName.ACTIVITIES}/>
          </TabsContent>
        </Tabs>
      </AuthWrapper>
    </div>
  );
};

export default Admin;
