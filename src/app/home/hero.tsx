"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchBrandingAssets } from "@/lib/fetch-branding";
import type { BrandingAssets } from "@/lib/branding-assets";
import ArrowIcon from "@/components/arrow-icon";

const FALLBACK_HERO = "https://res.cloudinary.com/dmioegrww/image/upload/v1792294239/741705230_122291761946035250_3199701299302573038_n_mmnku3.jpg";

export default function Hero() {
    const [assets, setAssets] = useState<BrandingAssets | null>(null);
    const [motionAllowed, setMotionAllowed] = useState(false);

    useEffect(() => {
        let active = true;
        fetchBrandingAssets().then((nextAssets) => {
            if (active) setAssets(nextAssets);
        }).catch(() => undefined);

        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotionPreference = () => setMotionAllowed(!motionQuery.matches);
        updateMotionPreference();
        motionQuery.addEventListener("change", updateMotionPreference);

        return () => {
            active = false;
            motionQuery.removeEventListener("change", updateMotionPreference);
        };
    }, []);

    const heroImage = assets?.hero?.resource_type === "image" ? assets.hero.url : FALLBACK_HERO;
    const heroVideo = motionAllowed && assets?.trailer?.resource_type === "video" ? assets.trailer : null;

    return (
        <section id="hero" className="hero-scene relative isolate min-h-svh overflow-hidden bg-ink text-white">
            <div className="hero-media absolute inset-0" aria-hidden="true">
                {heroVideo ? (
                    <video className="h-full w-full object-cover" poster={heroImage} autoPlay muted loop playsInline preload="auto" tabIndex={-1}>
                        <source src={heroVideo.url.replace("/upload/", "/upload/so_17,eo_37,q_auto:eco,w_1280,br_1000k/")} />
                    </video>
                ) : (
                    <Image src={heroImage} alt="" fill priority sizes="100vw" unoptimized={Boolean(assets?.hero)} className="object-cover object-center" />
                )}
            </div>
            <div className="hero-shade absolute inset-0" />

            <div className="relative mx-auto flex min-h-svh w-full max-w-[100rem] flex-col px-5 pb-0 pt-28 sm:px-8 sm:pt-32 lg:px-12">
                <div className="flex items-start justify-between gap-6 border-t border-white/40 pt-3 text-xs font-semibold uppercase tracking-[.12em] text-white sm:text-sm">
                    <span>June 4–6, 2027</span>
                    <span className="text-right">Manila, Philippines</span>
                </div>

                <div className="flex flex-1 flex-col justify-center py-10 sm:py-12">
                    <h1 className="hero-title font-header uppercase text-paper">
                        <span>Dance</span>{" "}
                        <span className="hero-title-offset text-gold">All out.</span>
                    </h1>
                    <div className="mt-8 flex flex-col gap-7 sm:mt-10 lg:flex-row lg:items-end lg:justify-between">
                        <p className="max-w-lg text-lg leading-8 text-white sm:text-xl">
                            Three days to learn, watch and dance in the heart of Manila.
                        </p>
                        <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
                            <Link href="/tickets" className="cta cta-solid px-6 py-4 text-sm">
                                Get your pass <ArrowIcon />
                            </Link>
                            <a href="#trailer" className="text-link inline-flex items-center gap-2 text-sm text-white">
                                Watch the film <ArrowIcon direction="down" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 border-t border-white/40 text-xs font-semibold uppercase tracking-[.12em] text-white sm:grid-cols-4 sm:text-sm">
                    <span className="border-r border-white/40 py-4 pr-3">Salsa</span>
                    <span className="py-4 pl-4 sm:border-r sm:border-white/40 sm:pl-5">Bachata</span>
                    <span className="border-r border-t border-white/40 py-4 pr-3 sm:border-t-0">Kizomba</span>
                    <span className="border-t border-white/40 py-4 pl-4 sm:border-t-0 sm:pl-5">Zouk</span>
                </div>
            </div>
        </section>
    );
}
