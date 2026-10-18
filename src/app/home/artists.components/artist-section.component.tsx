"use client";

import { fetchArtistImages } from "@/lib/fetch-artists";
import Image from "next/image";
import { useEffect, useState } from "react";

type CloudinaryImage = {
    public_id: string;
    url: string;
    width: number;
    height: number;
};

export default function ArtistsSectionComponent({ title, category, blurb, year }: { title: string; category: string; blurb: string; year: string }) {
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <section className="mx-auto grid min-h-[28rem] w-full max-w-7xl gap-0 border-b border-white/10 lg:grid-cols-[.4fr_1fr] lg:min-h-[34rem]">
            <div className="flex items-center bg-[#0d0a12] px-5 py-12 sm:px-8 lg:px-12"><div><p className="eyebrow text-[#f3d78a]">{year}</p><h3 className="mt-3 text-3xl font-semibold tracking-[-.04em]">{title}</h3><p className="mt-4 max-w-sm text-sm leading-7 text-white/50">{blurb}</p></div></div>
            <div className="relative flex min-w-0 items-center overflow-hidden bg-[#100c16] py-5">
                {loading ? <div className="grid min-h-[20rem] w-full place-items-center text-sm text-white/35">Curating the lineup...</div> : images.length > 0 ? <div className="image-section w-full"><div className="min-w-8" />{images.map((image) => <Image key={image.public_id} src={image.url} alt={`${title} artist`} width={image.width || 600} height={image.height || 600} className="mx-2 h-[20rem] w-auto rounded-2xl object-cover sm:h-[25rem]" unoptimized />)}<div className="min-w-8" /></div> : <div className="grid min-h-[20rem] w-full place-items-center text-sm italic text-white/35">Artists coming soon...</div>}
            </div>
        </section>
    );
}
