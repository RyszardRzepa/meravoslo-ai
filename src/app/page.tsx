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
            <TabsList className="rounded-none grid sm:max-w-72 grid-cols-2 bg-transparent mb-2 gap-2">
              <TabsTrigger
                value={TabName.EAT_DRINK}
                className="text-gray-800 bg-gray-100 data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-gray-900 data-[state=active]:bg-peachDark rounded-full"
              >

                <svg height="14" strokeLinejoin="round" viewBox="0 0 16 16" width="14">
                  <path
                    d="M2.5 0.5V0H3.5V0.5C3.5 1.60457 4.39543 2.5 5.5 2.5H6V3V3.5H5.5C4.39543 3.5 3.5 4.39543 3.5 5.5V6H3H2.5V5.5C2.5 4.39543 1.60457 3.5 0.5 3.5H0V3V2.5H0.5C1.60457 2.5 2.5 1.60457 2.5 0.5Z"
                    fill="currentColor"></path>
                  <path
                    d="M14.5 4.5V5H13.5V4.5C13.5 3.94772 13.0523 3.5 12.5 3.5H12V3V2.5H12.5C13.0523 2.5 13.5 2.05228 13.5 1.5V1H14H14.5V1.5C14.5 2.05228 14.9477 2.5 15.5 2.5H16V3V3.5H15.5C14.9477 3.5 14.5 3.94772 14.5 4.5Z"
                    fill="currentColor"></path>
                  <path
                    d="M8.40706 4.92939L8.5 4H9.5L9.59294 4.92939C9.82973 7.29734 11.7027 9.17027 14.0706 9.40706L15 9.5V10.5L14.0706 10.5929C11.7027 10.8297 9.82973 12.7027 9.59294 15.0706L9.5 16H8.5L8.40706 15.0706C8.17027 12.7027 6.29734 10.8297 3.92939 10.5929L3 10.5V9.5L3.92939 9.40706C6.29734 9.17027 8.17027 7.29734 8.40706 4.92939Z"
                    fill="currentColor"></path>
                </svg>
                <p className="pl-2">Inspirasjoner</p>
              </TabsTrigger>
              <TabsTrigger
                value={TabName.ACTIVITIES}
                className="text-gray-800 bg-gray-100 data-[state=active]:text-black data-[state=active]:border border border-gray-900  border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-peachDark rounded-full"
              >
                Søk
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
            <TabsContent className="overflow-y-scroll" value={TabName.ACTIVITIES}>
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
