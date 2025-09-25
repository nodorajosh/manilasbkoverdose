import Link from "next/link";

export default function Trailer() {
    return (
        <div
            id="trailer"
            className="bg-black text-white relative flex flex-row flex-wrap"
        >
            <div className="px-6 pt-12 pb-2 lg:pb-12 w-full lg:w-[67%]">
                <iframe
                    src="https://www.youtube.com/embed/mFjzuSR88oc?si=tEYimsN6LT6AJyBG"
                    width="100%"
                    height="100%"
                    className="aspect-video"
                    allowFullScreen
                />
            </div>
            {/* <div className="pl-6 w-full lg:w-[33%] flex flex-col flex-wrap justify-center content-center"> */}
            <div className="relative px-6 pt-2 lg:pt-12 pb-12 w-full lg:w-[33%] bg-black grid place-items-center z-5">
                <div className="glow px-6 py-6 shadow flex flex-col flex-wrap justify-center content-center bg-gradient-to-tr from-peach-800 via-neutral-dark via-black via-neutral-dark to-peach-800 rounded">
                    <h1 className="text-2xl text-center">
                        <span className="ul">&nbsp;Feel the Pulse Before It Begins&nbsp;</span>
                    </h1>
                    <p className="py-4 max-w-[85ch]">
                        Hit play and let the story unfold. Bright lights, powerful beats, and dancers moving as one—this is the heartbeat of SBKZ. From sunrise workshops that spark growth to late-night socials that never seem to end, our festival trailer gives you a taste of the rhythm, the passion, and the unforgettable nights waiting in Manila.
                    </p>
                    <div className="text-center font-header flex flex-wrap content-end justify-center">
                        <Link href="/tickets" className="px-6 cta cta-solid rounded pointer-events-none" aira-disabled="true" tabIndex={-1}>
                            <span className="h3 text-[1.2rem]">Join the Celebration</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
