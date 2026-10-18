import type { Metadata, Viewport } from "next";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"

import { Cormorant_Garamond, Montserrat } from 'next/font/google'
import "./globals.css";

import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer";
import { Providers } from "@/components/providers";

// const brexon = localFont({
//   src: "../assets/fonts/brexon.regular.ttf",
//   variable: "--font-header"
// })

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ['latin']
})
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
})

export const metadata: Metadata = {
  title: "Manila SBKZ Overdose | The Ultimate Afro-Latin Dance Festival",
  description:
    "Experience the most electrifying Afro-Latin dance festival in Manila! Join world-class instructors, social dance nights, and unforgettable performances at Manila SBKZ Overdose.",
  keywords: [
    "Manila SBKZ Overdose",
    "Afro-Latin dance festival Manila",
    "Salsa Bachata Kizomba event",
    "dance bootcamp",
    "social dancing Manila",
    "Dance festival 2025",
    "international dance festival",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://manila.sbkzoverdose.com/",
    title: "Manila SBKZ Overdose | The Ultimate Afro-Latin Dance Festival",
    description:
      "Join the ultimate Afro-Latin dance festival in Manila with top international artists, workshops, and social dance nights.",
    images: [
      {
        url: "https://manila.sbkzoverdose.com/banner.jpg",
        width: 1200,
        height: 630,
        alt: "Manila SBKZ Overdose - Afro-Latin Dance Festival",
      },
    ],
  },
};

export const viewport: Viewport = {
  // height: "device-height", 
  // width: "device-width", 
  // initialScale: 1, 
  minimumScale: 1,
  // targetDensity: "device-dpi"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cormorantGaramond.variable} ${montserrat.className}`}>
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
