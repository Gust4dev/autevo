import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';

import './globals.css';
import { TRPCProvider } from '@/lib/trpc/provider';
import { DevTools } from '@/components/debug/DevTools';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Filmtech OS',
    template: '%s | Filmtech OS',
  },
  description: 'Sistema de Ordem de Serviço para Estéticas Automotivas',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <TRPCProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
            <DevTools />
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
