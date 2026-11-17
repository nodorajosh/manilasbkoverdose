"use client";

import { fetchArtistImages } from "@/lib/fetch-artists";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type CloudinaryImage = {
    public_id: string;
    url: string;
    width: number;
    height: number;
};

export default function ArtistsSectionComponent({ title, category, blurb, year }: { title: string; category: string; blurb: string; year: string }) {
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const galleryRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        fetchArtistImages(year, category).then((nextImages) => {
            if (active) setImages(nextImages);
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [year, category, title]);

    const scrollGallery = (direction: number) => {
        galleryRef.current?.scrollBy({ left: direction * Math.min(640, window.innerWidth * .75), behavior: "smooth" });
    };

    return (
        <section className="border-b border-white/25 lg:grid lg:grid-cols-[.34fr_.66fr]">
            <div className="flex items-end px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
                <div>
                    <h3 className="max-w-sm font-header text-4xl uppercase leading-[.95] text-paper sm:text-5xl">{title}</h3>
                    <p className="mt-4 max-w-sm text-base leading-7 text-paper/65">{blurb}</p>
                    {!loading && images.length > 1 && (
                        <div className="mt-6 flex gap-2">
                            <button type="button" onClick={() => scrollGallery(-1)} className="gallery-button" aria-label={`Previous artists in ${title}`}>←</button>
                            <button type="button" onClick={() => scrollGallery(1)} className="gallery-button" aria-label={`Next artists in ${title}`}>→</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="min-w-0 border-t border-white/25 lg:border-l lg:border-t-0">
                {loading ? (
                    <div className="grid min-h-[25rem] w-full place-items-center px-5 text-sm text-paper/60">Loading the artists...</div>
                ) : images.length > 0 ? (
                    <div ref={galleryRef} className="image-section w-full gap-4 px-5 py-5 sm:px-8 lg:px-8" tabIndex={0} aria-label={`${title} gallery`}>
                        {images.map((image) => (
                            <Image key={image.public_id} src={image.url} alt={`${title} artist at Manila SBKZ Overdose`} width={image.width || 600} height={image.height || 800} className="h-[22rem] w-[17rem] shrink-0 snap-start object-cover sm:h-[28rem] sm:w-[22rem]" unoptimized />
                        ))}
                    </div>
                ) : (
                    <div className="grid min-h-[25rem] w-full place-items-center px-5 text-base text-paper/60">Artists coming soon.</div>
                )}
            </div>
        </section>
    );
}
