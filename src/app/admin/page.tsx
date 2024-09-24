import ScrapeDataForm from "@/app/admin/components/scrape-data-form";
import TagsTable from "@/app/admin/components/tags-tables";
import AuthWrapper from "@/app/admin/components/auth-wrapper";
import { getTags } from "@/app/admin/actions/tags";

const Admin = async () => {
  const tags = await getTags()

  return (
    <div className="w-full mx-auto p-12">
      <AuthWrapper>
        <ScrapeDataForm/>
        { tags && <TagsTable tags={tags} />}
      </AuthWrapper>
    </div>
  );
};

export default Admin;
