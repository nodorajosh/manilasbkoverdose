import Image from "next/image";


// const images = filenames.map(name => path.join('/', dirRelativeToPublicFolder, name))

// console.log(filenames)

export default function ArtistsSectionComponent({ title, blurb, image }: { title: string, blurb: string, image: string[] }) {

    return (
        <div className="relative flex flex-row flex-wrap">
            <div className="px-6 pt-12 pb-2 lg:pb-12 lg:min-h-[56dvh] w-full lg:w-[33%] bg-(--color-neutral-dark) grid place-items-center z-5">
                <div className="glow px-6 py-6 shadow flex flex-col flex-wrap justify-center content-center bg-gradient-to-tr from-peach-800 via-neutral-dark via-black via-neutral-dark to-peach-800 rounded">
                    <h1 className="text-2xl text-center">
                        <span className="">&nbsp;{title}&nbsp;</span>
                    </h1>
                    <p className="pt-4 max-w-[85ch]">
                        {blurb}
                    </p>
                </div>
            </div>
            <div className="relative w-full lg:w-[67%] grid place-items-center">

                {image && image.length > 0 ? (
                    <div className="image-section max-w-full min-h-[40dvh] lg:min-h-[56dvh]">
                        <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                        {image?.map((image: string, k: number) => (
                            <Image key={k} src={image} alt="image" width={600} height={600} className="image mx-2 my-6 h-[32dvh] lg:h-[48dvh] w-auto rounded" />
                        ))}
                        <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                    </div>) : (
                    <div className="image-section max-w-full min-h-[40dvh] lg:min-h-[56dvh] flex-wrap content-center justify-center">
                        <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                        <p className="text-center text-lg italic opacity-50">Artists to be announced soon. Stay tuned!</p>
                        <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                    </div>
                )}
            </div>
        </div>
    );
}
