'use client';

import { useState, useRef, useEffect } from 'react';
import { supabaseFrontent } from "@/lib/supabase/frontend";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ChatTab from '@/components/ChatTab';

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
        <Tabs defaultValue="spise-drikke" className="" onValueChange={setActiveTab}>
          <TabsList className="grid sm:max-w-72 grid-cols-2 bg-transparent">
            <TabsTrigger
              value="spise-drikke"
              className="data-[state=active]:border-b-2 data-[state=active]:border-peachDark data-[state=active]:bg-transparent"
            >
              Spise/Drikke
            </TabsTrigger>
            <TabsTrigger
              value="aktiviteter"
              className="data-[state=active]:border-b-2 data-[state=active]:border-peachDark data-[state=active]:bg-transparent"
            >
              Aktiviteter
            </TabsTrigger>
          </TabsList>
          <TabsContent value="spise-drikke">
            {activeTab === 'spise-drikke' && (
              <ChatTab
                uid={uid}
                threadId={spiseDrikkeThreadId}
                name={'Spise/Drikke'}
                exampleMessages={[
                  {
                    heading: 'Vi ser fire venner som vil spise godt og drikke billig i kveld. Hvor bør vi gå?',
                    message: 'Vi er fire venner som vil spise godt og drikke billig i kveld. Hvor bør vi gå?',
                  },
                ]}
              />
            )}
          </TabsContent>
          <TabsContent value="aktiviteter">
            {activeTab === 'aktiviteter' && (
              <ChatTab
                uid={uid}
                name={'Aktiviteter'}
                threadId={aktiviteterThreadId}
                exampleMessages={[
                  {
                    heading: 'Vi ser etter aktiviteter',
                    message: 'Vi ser etter aktiviteter',
                  },
                ]}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
