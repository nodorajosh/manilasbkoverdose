import type { Metadata, Viewport } from "next";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"

import { Montserrat } from 'next/font/google'
import localFont from "next/font/local"
import "./globals.css";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

// const brexon = localFont({
//   src: "../assets/fonts/brexon.regular.ttf",
//   variable: "--font-header"
// })

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ['latin']
})
const clashDisplay = localFont({
  src: "../assets/fonts/ClashDisplay-Variable.ttf",
  variable: "--font-header"

})

export const metadata: Metadata = {
  title: "Manila SBK Overdose | The Ultimate Afro-Latin Dance Festival",
  description:
    "Experience the most electrifying Afro-Latin dance festival in Manila! Join world-class instructors, social dance nights, and unforgettable performances at Manila SBK Overdose.",
  keywords: [
    "Manila SBK Overdose",
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
    url: "https://manilasbkoverdose.com/",
    title: "Manila SBK Overdose | The Ultimate Afro-Latin Dance Festival",
    description:
      "Join the ultimate Afro-Latin dance festival in Manila with top international artists, workshops, and social dance nights.",
    images: [
      {
        url: "https://manilasbkoverdose.com/banner.jpg",
        width: 1200,
        height: 630,
        alt: "Manila SBK Overdose - Afro-Latin Dance Festival",
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
    <html lang="en">
      <body className={`${clashDisplay.className} ${montserrat.className}`}>
        <Navbar />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
