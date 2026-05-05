import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/lib/session-context';

export const metadata: Metadata = {
  title: 'KLB Transport Command',
  description: 'Advanced school transport operations dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
