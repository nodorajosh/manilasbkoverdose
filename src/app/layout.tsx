import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";

import "./globals.css";

import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer";
import { Providers } from "@/components/providers";

const clashDisplay = localFont({
  src: "../assets/fonts/ClashDisplay-Variable.ttf",
  variable: "--font-clash",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manila SBKZ Overdose | Salsa, Bachata, Kizomba & Zouk",
  description: "Train by day and dance into the night at Manila SBKZ Overdose. Explore the artist lineup and choose your festival pass.",
  keywords: [
    "Manila SBKZ Overdose",
    "Afro-Latin dance festival Manila",
    "Salsa Bachata Kizomba Zouk event",
    "dance workshops Manila",
    "social dancing Manila",
    "international dance festival",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://manila.sbkzoverdose.com/",
    title: "Manila SBKZ Overdose | Manila Moves Different",
    description: "Salsa, Bachata, Kizomba and Zouk. Meet the artists and choose your festival pass.",
    images: [
      {
        url: "https://manila.sbkzoverdose.com/banner.jpg",
        width: 1200,
        height: 630,
        alt: "Manila SBKZ Overdose Afro-Latin dance festival",
      },
    ],
  },
};

export const viewport: Viewport = {
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clashDisplay.variable}>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
