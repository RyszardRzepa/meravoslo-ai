import ScrapeDataForm from "@/app/admin/scrape-data-form";

const Admin = async () => {
  return (
    <div className="w-full mx-auto p-12">
      <h3>Scrape data from a url</h3>
      <ScrapeDataForm />
    </div>
  );
};

export default Admin;
