import Dashboard from "@/app/admin/components/dashboard";

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Dashboard>
      {children}
    </Dashboard>
  );
}

export const runtime = 'edge';
