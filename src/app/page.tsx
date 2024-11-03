'use client';

import { useState, useRef, useEffect } from 'react';
import { supabaseFrontent } from "@/lib/supabase/frontend";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ChatTab from '@/components/ChatTab';
import { TabName } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  const [uid, setUid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('spise-drikke');
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
    <>
      <div id="chat-container" className="bg-background">
        <div className="fixed top-0 left-0 right-0 z-10 bg-background border-b border-b-peachDark">

          <Tabs defaultValue={TabName.EAT_DRINK} className="" onValueChange={setActiveTab}>
            <TabsList className="rounded-none grid sm:max-w-72 grid-cols-2 bg-transparent mb-2">
              <TabsTrigger
                value={TabName.EAT_DRINK}
                className="data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-gray-900 data-[state=active]:bg-transparent rounded-full"
              >
                Mat og Drikke
              </TabsTrigger>
              <TabsTrigger
                value={TabName.ACTIVITIES}
                className="data-[state=active]:text-black data-[state=active]:border border border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent rounded-full"
              >
                Aktiviteter
              </TabsTrigger>
            </TabsList>

            <Separator className="bg-gray-200 h-[1.5px]"/>

            <TabsContent className="overflow-y-scroll" value={TabName.EAT_DRINK}>
              <ChatTab
                uid={uid}
                threadId={spiseDrikkeThreadId}
                name={TabName.EAT_DRINK}
                exampleMessages={[
                  {
                    heading: 'Vi er fire venner som vil spise godt i kveld. Hvor bør vi gå?',
                    message: 'Vi er fire venner som vil spise godt i kveld. Hvor bør vi gå?',
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
                    heading: 'Gi meg tips for aktiviteter denne helgen',
                    message: 'Gi meg tips for aktiviteter denne helgen',
                  },
                  {
                    heading: 'Hva kan vi gjøre gratis?',
                    message: 'Hva kan vi gjøre gratis?',
                  },
                  {
                    heading: 'Finn noe kult å gjøre for to personer',
                    message: 'Finn noe kult å gjøre for to personer',
                  },
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
