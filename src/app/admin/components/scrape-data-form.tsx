'use client'
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import extractDataFromUrl from "@/app/admin/actions/extractDataFromUrl";

import { Business } from "@/app/admin/types";
import EditableTable from "@/app/admin/components/editable-table";
import { TabName } from "@/lib/types";

const ScrapeDataForm = ({ name }: { name: TabName }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<{ url: string }>({
    url: ''
  });
  const [data, setData] = useState<Business[]>([]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await extractDataFromUrl(formData.url.trim())
      if (!data.businesses) return null;

      setData(data.businesses)
      setLoading(false);
    } catch (e) {
      console.log("error", e)
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 max-w-[500px]">
        <Input
          placeholder={"Enter URL"}
          type="text"
          id="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
        />
        <Button type="button" onClick={handleSubmit}>{loading ? "loading" : "Scrape data"}</Button>
      </div>

      {data.length > 0 && (<EditableTable name={name} data={data} />)}
    </div>
  );
};

export default ScrapeDataForm;
