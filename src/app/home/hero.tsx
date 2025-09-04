"use client"

import Image from "next/image";
import Link from "next/link";

import HeroBG from "../../assets/images/manilasbk_hero_bg.png"
import HeroText from "../../assets/images/manilasbk_hero_text.svg"
import HeroOverlay from "../../assets/images/manilasbk_hero_overlay.png"

const styles = {
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "cover",
}

export default function Hero() {
    return (
        <div
            id="hero"
            className="h-dvh bg-[#0d0d0d] relative"
        >
            <div
                className="h-full w-full aspect-video grid place-items-center">
                <video
                    className="w-full md:h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                >
                    <source src="https://res.cloudinary.com/dptolxtcn/video/upload/v1757019545/SBKZ_rxdgbj.mp4" type="video/mp4" />
                </video>
            </div>
            {/* <h1 className="absolute top-0 left-0 opacity-0">Ignite the Night</h1>
            <h3 className="absolute top-0 left-0 opacity-0">with Afro-Latin Rhythms in Manila</h3>
            <div
                className="p-6 h-full w-full text-white absolute grid place-items-center"
                style={{ ...styles, backgroundImage: `url(${HeroBG.src})` }}
            >
                <div className="text-center font-header sm:h-[10rem] md:h-[12rem] xl:h-[25rem]">
                    <Image src={HeroText.src} alt="Ignite the Night with Afro-Latin Rhythms in Manila" width={0} height={0} style={{ width: '100%', height: 'auto' }} />
                </div>

            </div>
            <div
                className="h-full w-full text-white absolute grid place-items-center"
                style={{ ...styles, backgroundImage: `url(${HeroOverlay.src})` }}
            >
                <div className="text-center font-header h-[20rem] flex flex-wrap content-end justify-center">
                    <Link href="https://ticket.manilasbkoverdose.com/products/full-event-pass-1" className="px-6 cta rounded pointer-events-none" aira-disabled="true" tabIndex={-1}>
                        <span className="h3 text-[1.2rem]">Get Your Tickets Now</span>
                    </Link>
                </div>
            </div> */}
            {/* <p className="absolute inset-x-0 bottom-6 text-white text-center">
                Scroll Down
            </p> */}
            <div className="absolute inset-x-0 bottom-6 flex flex-wrap content-start justify-center">
                <div className="scrolldown">
                    <div className="chevrons">
                        <div className="chevrondown"></div>
                        <div className="chevrondown"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
