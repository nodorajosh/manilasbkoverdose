import Link from "next/link";

export default function Trailer() {
    return (
        <div
            id="trailer"
            className="bg-black text-white relative flex flex-row flex-wrap"
        >
            <div className="px-6 pt-12 pb-2 lg:pb-12 w-full lg:w-[67%]">
                <iframe
                    src="https://player.vimeo.com/video/1047047277"
                    width="100%"
                    height="100%"
                    className="aspect-video"
                    allowFullScreen
                />
            </div>
            {/* <div className="pl-6 w-full lg:w-[33%] flex flex-col flex-wrap justify-center content-center"> */}
            <div className="relative px-6 pt-2 lg:pt-12 pb-12 w-full lg:w-[33%] bg-black grid place-items-center z-5">
                <div className="glow px-6 py-6 shadow flex flex-col flex-wrap justify-center content-center bg-gradient-to-tr from-secondary-dark via-neutral-dark via-black via-neutral-dark to-secondary-dark rounded">
                    <h1 className="text-2xl text-center">
                        <span className="ul">&nbsp;A Glimpse Into the Magic&nbsp;</span>
                    </h1>
                    <p className="py-4 max-w-[85ch]">
                        Press play. Feel the energy. Witness the passion. Our festival trailer is your ticket to the sights and
                        sounds of Manila SBK Overdose. From the electrifying workshops to the unmissable socials, see what’s waiting
                        for you this year!
                    </p>
                    <div className="text-center font-header flex flex-wrap content-end justify-center">
                        <Link href="https://ticket.manilasbkoverdose.com/products/full-event-pass-1" className="px-6 cta rounded">
                            <span className="h3 text-[1.2rem]">Join the Celebration</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
