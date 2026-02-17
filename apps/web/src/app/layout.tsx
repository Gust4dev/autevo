import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Inter, Lexend_Deca, Delius } from "next/font/google";

import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { TutorialProvider } from "@/components/providers/TutorialProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-lexend",
  display: "swap",
  preload: true,
});

const delius = Delius({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-delius",
  display: "swap",
  preload: true,
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://autevo.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Autevo - Sistema de Gestão para Estética Automotiva",
    template: "%s | Autevo",
  },
  description:
    "Sistema completo de gestão para gestão automotiva. Controle ordens de serviço, clientes, agendamentos, vistorias com fotos, financeiro e comissões. Evolua sua oficina.",
  keywords: [
    "estética automotiva",
    "polimento automotivo",
    "sistema de gestão",
    "ordem de serviço",
    "detalhamento automotivo",
    "software para oficina",
    "gestão de clientes",
    "agendamento online",
    "vistoria veicular",
    "controle financeiro",
    "comissão funcionários",
    "SaaS automotivo",
  ],
  authors: [{ name: "Autevo" }],
  creator: "Autevo",
  publisher: "Autevo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: baseUrl,
    siteName: "Autevo",
    title: "Autevo - Sistema de Gestão para Estética Automotiva",
    description:
      "Sistema completo para gestão automotiva. Controle ordens de serviço, clientes, agendamentos, vistorias e financeiro.",
    images: [
      {
        url: "/branding/ogImage.png",
        width: 1200,
        height: 630,
        alt: "Autevo - Sistema de Gestão para Estética Automotiva",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Autevo - Sistema de Gestão para Estética Automotiva",
    description: "Sistema completo para gestão automotiva. Evolua sua oficina.",
    images: ["/branding/ogImage.png"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  category: "business",
};

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
        <head>
          <link rel="apple-touch-icon" href="/branding/icon-192x192.png" />
        </head>
        <body
          className={`${inter.variable} ${lexendDeca.variable} ${delius.variable} font-sans antialiased`}
        >
          <TRPCProvider>
            <TutorialProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
              />
            </TutorialProvider>
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
