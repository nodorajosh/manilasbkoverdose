"use client"

import { useState } from "react"
import Link from "next/link";

import ArtistsSectionComponent from "./artist-section.component";

export default function ArtistsPageComponent({ imageObject }: {
    imageObject: {
        [key: string]: {
            [key: string]: undefined | string | string[];
        };
    }
}) {

    const [year, setYear] = useState(Object.keys(imageObject).reverse()[0])

    return (
        <div
            id="artists"
            className="py-12 relative grid place-items-center text-white bg-(--color-neutral-dark)"
        >
            <div className="select">
                <div className="selected flex flex-row flex-wrap items-center justify-center">
                    <span>
                        {year}
                    </span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="1em"
                        viewBox="0 0 512 512"
                        className="arrow"
                    >
                        <path
                            d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                        ></path>
                    </svg>
                </div>

                <div className="options">
                    {Object.keys(imageObject).reverse().map((yr) => (
                        <p key={yr} onClick={() => setYear(yr)}>
                            {yr}
                        </p>
                    ))}
                </div>
            </div>

            <div className="w-full">

                <h1 className="pb-3 text-2xl text-center">
                    <span className="mx-6 ul">&nbsp;Manila {year === "2025" || year === "2024" ? ("SBKZ") : ("SBKZ")} Overdose {year}&nbsp;</span>
                </h1>
                {/* <div className="grid place-items-center">
                        <Image src={imageObject[year]["collage"]} alt="image" width={imageSize} height={imageSize} className="m-6 w-[75dvw] md:w-[50dvw] h-auto rounded" />
                    </div> */}

                {/* Main Artists */}
                <ArtistsSectionComponent
                    title={"Main Artists"}
                    blurb={"World-renowned talents bringing electrifying performances and unmatched expertise to the stage."}
                    image={imageObject[year]["Main Artists"] as string[] || []}
                />

                {/* Additional International Artists */}
                <ArtistsSectionComponent
                    title={"Additional International Artists"}
                    blurb={"Global sensations adding flair and diversity to the festival's vibrant lineup."}
                    image={imageObject[year]["Additional International Artists"] as string[] || []}
                />

                {/* Local Artists */}
                <ArtistsSectionComponent
                    title={"Local Artists"}
                    blurb={"Homegrown stars showcasing the heart and soul of the Filipino dance community."}
                    image={imageObject[year]["Local Artists"] as string[] || []}
                />

                {/* Performers */}
                <ArtistsSectionComponent
                    title={"Performers"}
                    blurb={"Dynamic acts guaranteed to captivate and inspire every step of the way."}
                    image={imageObject[year]["Performers"] as string[] || []}
                />

                {/* DJs */}
                <ArtistsSectionComponent
                    title={"DJs"}
                    blurb={"Masterminds behind the beats, setting the perfect tempo for unforgettable nights."}
                    image={imageObject[year]["DJs"] as string[] || []}
                />

                {/* Ambassadors */}
                <ArtistsSectionComponent
                    title={"Ambassadors"}
                    blurb={"Passionate advocates connecting cultures and championing the spirit of dance."}
                    image={imageObject[year]["Ambassadors"] as string[] || []}
                />

                {/* Hosts */}
                <ArtistsSectionComponent
                    title={"Hosts"}
                    blurb={"Charismatic personalities guiding you through an unforgettable journey of rhythm and energy."}
                    image={imageObject[year]["Hosts"] as string[] || []}
                />

                {/* Event Organizers */}
                <ArtistsSectionComponent
                    title={"Event Organizers"}
                    blurb={"The visionary team orchestrating a seamless and spectacular celebration of dance."}
                    image={imageObject[year]["Event Organizers"] as string[] || []}
                />

            </div>

            <div className="sticky bottom-12 text-center font-header flex flex-wrap content-end justify-center z-8">
                <Link href="https://ticket.manilasbkoverdose.com/products/full-event-pass-1" className="px-6 cta rounded pointer-events-none" aira-disabled="true" tabIndex={-1}>
                    <span className="h3 text-[1.2rem]">Join Us Now</span>
                </Link>
            </div>
        </div >
    );
}
