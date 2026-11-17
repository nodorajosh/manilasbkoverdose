"use client";

import Image from "next/image";
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
        <section id="trailer" className="bg-ink px-5 py-16 text-white sm:px-8 sm:py-24 lg:px-12">
            <div className="mx-auto w-full max-w-[100rem]">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 md:flex-row md:items-end">
                    <h2 className="font-header text-5xl uppercase leading-[.9] text-white sm:text-7xl lg:text-8xl">
                        Press play.<br /><span className="text-gold">Feel the room.</span>
                    </h2>
                    <p className="max-w-sm text-base leading-7 text-white/70 md:pb-2 md:text-right">
                        Real floors. Real dancers. See what happens when Manila steps onto the floor.
                    </p>
                </div>

                <div className="relative aspect-video w-full overflow-hidden border border-white/30 bg-black">
                    {trailer?.resource_type === "video" ? (
                        <video src={trailer.url} poster="https://res.cloudinary.com/dmioegrww/image/upload/v1792294239/741705230_122291761946035250_3199701299302573038_n_mmnku3.jpg" className="h-full w-full object-cover" controls playsInline preload="metadata" />
                    ) : trailer ? (
                        <Image src={trailer.url} alt="Manila SBKZ Overdose festival film" fill unoptimized className="object-cover" />
                    ) : (
                        <iframe
                            src="https://www.youtube.com/embed/CbGNqqe3Zuw?si=Soe7H1ZOWUas9Ku8"
                            width="100%"
                            height="100%"
                            className="absolute inset-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            title="Manila SBKZ Overdose festival film"
                        />
                    )}
                </div>
                <div className="flex flex-col gap-2 border-b border-white/30 py-4 text-xs font-semibold uppercase tracking-[.12em] text-white/70 sm:flex-row sm:items-center sm:justify-between">
                    <span>Manila SBKZ Overdose</span>
                    <span>Turn it up. Watch it full screen.</span>
                </div>
            </div>
        </section>
    );
}
