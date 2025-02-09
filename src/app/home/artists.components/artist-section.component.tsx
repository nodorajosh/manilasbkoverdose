import Image from "next/image";


// const images = filenames.map(name => path.join('/', dirRelativeToPublicFolder, name))

// console.log(filenames)

export default function ArtistsSectionComponent({ title, blurb, image }: { title: string, blurb: string, image: string[] }) {

    return (
        <div className="relative flex flex-row flex-wrap">
            <div className="px-5 py-10 lg:min-h-[56dvh] w-full lg:w-[33%] bg-(--color-neutral-dark) grid place-items-center z-5">
                <div className="glow px-5 py-10 shadow flex flex-col flex-wrap justify-center content-center bg-gradient-to-tr from-secondary-dark via-neutral-dark via-black via-neutral-dark to-secondary-dark rounded">
                    <h1 className="pb-3 text-2xl text-center">
                        <span className="">&nbsp;{title}&nbsp;</span>
                    </h1>
                    <p className="py-3 max-w-[85ch]">
                        {blurb}
                    </p>
                </div>
            </div>
            <div className="relative w-full lg:w-[67%] grid place-items-center">

                <div className="image-section max-w-full min-h-[40dvh] lg:min-h-[56dvh]">
                    <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                    {image?.map((image: string, k: number) => (
                        <Image key={k} src={image} alt="image" width={600} height={600} className="image m-5 h-[32dvh] lg:h-[48dvh] w-auto rounded" />
                    ))}
                    <div className="min-w-[9dvh] lg:min-w-[13dvh]">&nbsp;</div>
                </div>
            </div>
        </div>
    );
}
