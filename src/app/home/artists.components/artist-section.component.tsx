import Image from "next/image";

export default function ArtistsSectionComponent({
    title,
    blurb,
    image,
}: {
    title: string;
    blurb: string;
    image: string[];
}) {
    return (
        <div className="relative flex flex-row flex-wrap">
            {/* Left text section */}
            <div className="px-6 pt-12 pb-2 lg:pb-12 lg:min-h-[56dvh] w-full lg:w-[33%] bg-(--color-neutral-dark) grid place-items-center z-5">
                <div className="glow px-6 py-6 shadow flex flex-col flex-wrap justify-center content-center bg-gradient-to-tr from-secondary-dark via-neutral-dark via-black via-neutral-dark to-secondary-dark rounded">
                    <h1 className="text-2xl text-center">
                        <span>&nbsp;{title}&nbsp;</span>
                    </h1>
                    <p className="pt-4 max-w-[85ch]">{blurb}</p>
                </div>
            </div>

            {/* Right image section */}
            <div className="relative w-full lg:w-[67%] grid place-items-center">
                <div className="image-section max-w-full min-h-[40dvh] lg:min-h-[56dvh] flex flex-wrap justify-center items-center">
                    {/* Left spacer */}
                    <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>

                    {/* If images exist, show them, otherwise fallback message */}
                    {image && image.length > 0 ? (
                        image.map((img: string, k: number) => (
                            <Image
                                key={k}
                                src={img}
                                alt="artist image"
                                width={600}
                                height={600}
                                className="image mx-2 my-6 h-[32dvh] lg:h-[48dvh] w-auto rounded"
                            />
                        ))
                    ) : (
                        <p className="text-center text-lg font-medium text-white opacity-80">
                            Artists Coming Soon...
                        </p>
                    )}

                    {/* Right spacer */}
                    <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                </div>
            </div>
        </div>
    );
}
