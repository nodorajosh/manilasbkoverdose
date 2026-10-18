"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import CloudinaryLogo from "@/components/cloudinary-logo";
const FALLBACK_HERO = "https://res.cloudinary.com/dmioegrww/image/upload/v1792294239/741705230_122291761946035250_3199701299302573038_n_mmnku3.jpg";
import { fetchBrandingAssets } from "@/lib/fetch-branding";
import type { BrandingAsset } from "@/lib/branding-assets";

export default function Hero() {
    const [hero, setHero] = useState<BrandingAsset | null>(null);

    useEffect(() => {
        let active = true;
        fetchBrandingAssets().then((assets) => {
            if (active) setHero(assets?.hero ?? null);
        }).catch(() => undefined);

        return () => {
            active = false;
        };
    }, []);

    return (
        <section id="hero" className="relative isolate min-h-dvh overflow-hidden bg-[#09070d] text-white">
            <div className="absolute inset-0">
                {hero?.resource_type === "video" ? <video className="h-full w-full object-cover opacity-65" autoPlay muted loop playsInline><source src={hero.url} /></video> : <Image src={hero?.url ?? FALLBACK_HERO} alt={hero ? "Manila SBKZ Overdose hero" : "Filipino couple dancing salsa in a Manila nightclub"} fill priority sizes="100vw" unoptimized={Boolean(hero)} className="object-cover object-center opacity-65" />}
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(8,5,12,.98)_8%,rgba(27,10,35,.7)_52%,rgba(8,5,12,.3)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(243,215,138,.2),transparent_28%)]" />
            <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col justify-end px-5 pb-12 pt-32 sm:px-8 sm:pb-16 lg:px-12">
                <div className="max-w-4xl"><CloudinaryLogo className="h-auto w-32 sm:w-44" /><p className="eyebrow mt-9 text-[#f3d78a]">Afro - Latin Dance Festival</p><h1 className="mt-4 max-w-4xl text-6xl leading-[.9] tracking-[-.06em] sm:text-8xl lg:text-9xl">Where the city moves as one.</h1><p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg">Three days of workshops, world-class artists, and late-night connection in the heart of Manila.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/tickets" className="cta cta-solid px-6 py-3.5 text-sm uppercase tracking-[.14em]">Get your pass</Link><a href="#artists" className="cta cta-outline px-6 py-3.5 text-sm uppercase tracking-[.14em]">Meet the lineup</a></div></div>
                <div className="mt-14 flex flex-wrap gap-8 border-t border-white/15 pt-5 text-xs uppercase tracking-[.18em] text-white/50"><span>Manila, Philippines</span><span>Dance · music · culture</span></div>
            </div>
        </section>
    );
}
