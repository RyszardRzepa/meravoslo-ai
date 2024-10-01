'use client'
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Admin = ({ children }: { children: React.ReactNode }) => {
  const password = "mao-assistant";
  const [showPage, setShowPage] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");

  return (
    <div>
      {showPage ? (<div>
        <h3>Scrape data from a url</h3>
        {children}
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
