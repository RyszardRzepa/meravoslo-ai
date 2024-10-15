'use client';

import { useState, useRef, useEffect } from 'react';
import { supabaseFrontent } from "@/lib/supabase/frontend";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ChatTab from '@/components/ChatTab';
import { TabName } from "@/lib/types";

export default function Page() {
  const [uid, setUid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('spise-drikke');
  const divRef = useRef(null);

  const spiseDrikkeThreadId = useRef(new Date().getTime()).current;
  const aktiviteterThreadId = useRef(new Date().getTime()).current;

  useEffect(() => {
    const login = async () => {
      const { data } = await supabaseFrontent.auth.getSession();
      if (!data.session) {
        const { data, error } = await supabaseFrontent.auth.signInAnonymously()
        if (data) {
          setUid(data?.user?.id!)
        }
        return
      }
      setUid(data.session.user.id)
    }
    login()
  }, []);

  return (
    <div ref={divRef} id="chat-container" className="bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-b-peachDark">
        <Tabs defaultValue={TabName.EAT_DRINK} className="" onValueChange={setActiveTab}>
          <TabsList className="grid sm:max-w-72 grid-cols-2 bg-transparent mb-4">
            <TabsTrigger
              value={TabName.EAT_DRINK}
              className="data-[state=active]:border data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:rounded-md"
            >
              Mat og Drikke
            </TabsTrigger>
            <TabsTrigger
              value={TabName.ACTIVITIES}
              className="data-[state=active]:border data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:rounded-md"
            >
              Aktiviteter
            </TabsTrigger>
          </TabsList>
          <TabsContent value={TabName.EAT_DRINK}>
              <ChatTab
                uid={uid}
                threadId={spiseDrikkeThreadId}
                name={TabName.EAT_DRINK}
                exampleMessages={[
                  {
                    heading: 'Vi er fire venner som vil spise godt og drikke billig i kveld. Hvor bør vi gå?',
                    message: 'Vi er fire venner som vil spise godt og drikke billig i kveld. Hvor bør vi gå?',
                  },
                  {
                    heading: 'Hvor er beste indisk i Oslo?',
                    message: 'Hvor er beste indisk i Oslo?',
                  },
                  {
                    heading: 'Hvor kan  jeg gå for en romantisk date?',
                    message: 'Hvor kan jeg gå for en romantisk date?',
                  },
                ]}
              />
          </TabsContent>
          <TabsContent value={TabName.ACTIVITIES}>
              <ChatTab
                uid={uid}
                name={TabName.ACTIVITIES}
                threadId={aktiviteterThreadId}
                exampleMessages={[
                  {
                    heading: 'Vi ser etter aktiviteter',
                    message: 'Vi ser etter aktiviteter',
                  },
                ]}
              />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
