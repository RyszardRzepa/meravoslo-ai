import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

import { AI } from './action';
import { Providers } from '@/components/providers';

const meta = {
  title: 'AI RSC Demo',
  description:
    'Demo of an interactive financial assistant built using Next.js and Vercel AI SDK.',
};
export const metadata: Metadata = {
  ...meta,
  title: {
    default: 'AI RSC Demo',
    template: `%s - AI RSC Demo`,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  twitter: {
    ...meta,
    card: 'summary_large_image',
    site: '@vercel',
  },
  openGraph: {
    ...meta,
    locale: 'en-US',
    type: 'website',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <head>
      <link href="https://firebasestorage.googleapis.com/v0/b/notioncrm-27d2c.appspot.com/o/index-B8ylSJLO.css?alt=media&token=1b41d10c-172b-4fb8-9b22-da29c9b38cdb" rel="stylesheet"/>
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
          <main className="flex flex-col flex-1">
            {children}
          </main>
        </div>
      </Providers>
    </AI>
    <Analytics/>
    <div className="hidden md:block absolute left-3 bottom-1 text-white p-2 bg-blue-500">md</div>
    </body>
    </html>
  );
}

export const runtime = 'edge';
