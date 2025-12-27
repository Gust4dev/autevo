import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";

import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { DevTools } from "@/components/debug/DevTools";
import { TutorialProvider } from "@/components/providers/TutorialProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@filmtech/database";

export async function generateMetadata(): Promise<Metadata> {
  const { userId } = await auth();

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        tenant: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
    });

    if (user?.tenant) {
      return {
        title: `${user.tenant.name} | FilmtechOS`,
        icons: {
          icon: user.tenant.logo || "/favicon.ico",
        },
      };
    }
  }

  return {
    title: {
      default: "Filmtech OS",
      template: "%s | Filmtech OS",
    },
    description: "Sistema de Ordem de Serviço para Estéticas Automotivas",
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
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
            <TutorialProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
              />
              <DevTools />
            </TutorialProvider>
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
