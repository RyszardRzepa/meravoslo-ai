'use client'
import ScrapeDataForm from "@/app/admin/scrape-data-form";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Admin = () => {
  const password = "mao-assistant";
  const [showPage, setShowPage] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  return (
    <div className="w-full mx-auto p-12">
      {showPage ? (<div>
        <h3>Scrape data from a url</h3>
        <ScrapeDataForm/>
      </div>) : (<div className="flex gap-4 flex-col">
        <h3>Type password</h3>
        <Input onChange={(e) => {
          setPasswordInput(e.target.value)
        }}/>
        <Button onClick={() => {
          if (passwordInput === password) {
            setShowPage(true);
          }
        }}>Submit</Button>
      </div>)}
    </div>
  );
};

export default Admin;
