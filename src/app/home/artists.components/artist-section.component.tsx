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

export default function ArtistsSectionComponent({
    title,
    blurb,
    year,
}: {
    title: string;
    blurb: string;
    year: string;
}) {
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        fetchArtistImages(year, title)
            .then(setImages)
            .finally(() => setLoading(false));
    }, [year, title]);

    return (
        <div className="relative flex flex-row flex-wrap">
            <div className="px-6 pt-12 pb-2 lg:pb-12 lg:min-h-[56dvh] w-full lg:w-[33%] bg-(--color-neutral-dark) grid place-items-center z-5">
                <div className="glow px-6 py-6 shadow flex flex-col flex-wrap justify-center content-center bg-gradient-to-tr from-peach-800 via-neutral-dark via-black via-neutral-dark to-peach-800 rounded">
                    <h1 className="text-2xl text-center">
                        <span>&nbsp;{title}&nbsp;</span>
                    </h1>
                    <p className="pt-4 max-w-[85ch]">{blurb}</p>
                </div>
            </div>

            <div className="relative w-full lg:w-[67%] grid place-items-center">
                {loading ? (
                    <div className="image-section max-w-full min-h-[40dvh] lg:min-h-[56dvh] flex items-center justify-center">
                        <p className="text-sm opacity-50">Loading…</p>
                    </div>
                ) : images.length > 0 ? (
                    <div className="image-section max-w-full min-h-[40dvh] lg:min-h-[56dvh]">
                        <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>

                        {images.map((img, k) => (
                            <Image
                                key={img.public_id + k}
                                src={img.url}
                                alt=""
                                width={600}
                                height={600}
                                className="image mx-2 my-6 h-[32dvh] lg:h-[48dvh] w-auto rounded"
                            />
                        ))}

                        <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                    </div>
                ) : (
                    <div className="image-section max-w-full min-h-[40dvh] lg:min-h-[56dvh] flex-wrap content-center justify-center">
                        <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                        <p className="text-center text-lg italic opacity-50">
                            Artists coming soon...
                        </p>
                        <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                    </div>
                )}
            </div>
        </div>
    );
}