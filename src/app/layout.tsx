import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

import { AI } from './actions/ai';
import { Providers } from '@/components/providers';

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" style={{ colorScheme: "light", scrollbarColor: "#888 #f1f1f1", scrollbarWidth: "thin" }}>
    <head>
      <meta name="color-scheme" content="light"/>
      <link
        href="https://firebasestorage.googleapis.com/v0/b/notioncrm-27d2c.appspot.com/o/index-DTTaOEhY.css?alt=media&token=f193096e-6154-4b13-b294-3240d0555907"
        rel="stylesheet"/>
    </head>
    <body
      className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}
    >
    <Toaster/>
    <AI>
      <Providers
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex flex-col min-h-screen">
          <main className="flex flex-col flex-1 bg-peachLight">
            {children}
          </main>
        </div>
      </Providers>
    </AI>
    <Analytics/>
    {/*<div className="hidden sm:hidden md:block lg:hidden absolute left-3 bottom-1 text-white p-2 bg-blue-500">md</div>*/}
    {/*<div className="sm:block md:hidden lg:hidden absolute left-3 bottom-1 text-white p-2 bg-blue-500">sm</div>*/}
    {/*<div className="hidden lg:block absolute left-3 bottom-1 text-white p-2 bg-blue-500">lg</div>*/}
    </body>
    </html>
  );
}

export const runtime = 'edge';
