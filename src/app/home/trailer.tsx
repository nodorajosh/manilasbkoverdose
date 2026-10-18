"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchBrandingAssets } from "@/lib/fetch-branding";
import type { BrandingAsset } from "@/lib/branding-assets";

export default function Trailer() {
    const [trailer, setTrailer] = useState<BrandingAsset | null>(null);

    useEffect(() => {
        let active = true;
        fetchBrandingAssets().then((assets) => {
            if (active) setTrailer(assets?.trailer ?? null);
        }).catch(() => undefined);

        return () => {
            active = false;
        };
    }, []);

    return (
        <section id="trailer" className="bg-[#0d0a12] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12"><div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.4fr_.6fr] lg:items-center"><div className="relative aspect-video overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-2xl shadow-black/40">{trailer?.resource_type === "video" ? <video src={trailer.url} className="h-full w-full object-cover" controls playsInline /> : trailer ? <Image src={trailer.url} alt="Manila SBKZ Overdose trailer" fill unoptimized className="object-cover" /> : <iframe src="https://www.youtube.com/embed/CbGNqqe3Zuw?si=Soe7H1ZOWUas9Ku8" width="100%" height="100%" className="absolute inset-0" allowFullScreen title="Manila SBKZ Overdose festival trailer" />}</div><div className="rounded-[1.75rem] border border-[#f3d78a]/25 bg-[radial-gradient(circle_at_80%_10%,rgba(243,215,138,.2),transparent_26%),linear-gradient(145deg,rgba(82,33,102,.5),rgba(255,255,255,.03))] p-7 sm:p-9"><p className="eyebrow text-[#f3d78a]">Feel the pulse</p><h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-.05em]">This is your invitation.</h2><p className="mt-5 text-sm leading-7 text-white/60">Bright lights, powerful beats, and dancers moving as one. Press play, then step into the story.</p><Link href="/tickets" className="cta cta-solid mt-7 inline-flex px-5 py-3 text-sm uppercase tracking-[.12em]">Join the celebration</Link></div></div></section>
    );
}
