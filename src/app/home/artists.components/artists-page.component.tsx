"use client";

import { useState } from "react";
import Link from "next/link";

import ArtistsSectionComponent from "./artist-section.component";

const YEARS = ["2024", "2025", "2026"];

export default function ArtistsPageComponent() {
    const [year, setYear] = useState(YEARS[YEARS.length - 1]);

    return (
        <div
            id="artists"
            className="py-12 relative grid place-items-center text-white bg-(--color-neutral-dark)"
        >
            <div className="select">
                <div className="selected flex flex-row flex-wrap items-center justify-center">
                    <span>{year}</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="1em"
                        viewBox="0 0 512 512"
                        className="arrow"
                    >
                        <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                    </svg>
                </div>

                <div className="options">
                    {[...YEARS].reverse().map((yr) => (
                        <p key={yr} onClick={() => setYear(yr)}>
                            {yr}
                        </p>
                    ))}
                </div>
            </div>

            <div className="w-full">
                <h1 className="pb-3 text-2xl text-center">
                    <span className="mx-6 ul">
                        &nbsp;Manila SBKZ Overdose {year}&nbsp;
                    </span>
                </h1>

                <ArtistsSectionComponent
                    year={year}
                    title="Main Artists"
                    blurb="World-renowned talents bringing electrifying performances and unmatched expertise to the stage."
                />

                <ArtistsSectionComponent
                    year={year}
                    title="Additional International Artists"
                    blurb="Global sensations adding flair and diversity to the festival's vibrant lineup."
                />

                <ArtistsSectionComponent
                    year={year}
                    title="Local Artists"
                    blurb="Homegrown stars showcasing the heart and soul of the Filipino dance community."
                />

                <ArtistsSectionComponent
                    year={year}
                    title="Performers"
                    blurb="Dynamic acts guaranteed to captivate and inspire every step of the way."
                />

                <ArtistsSectionComponent
                    year={year}
                    title="DJs"
                    blurb="Masterminds behind the beats, setting the perfect tempo for unforgettable nights."
                />

                <ArtistsSectionComponent
                    year={year}
                    title="Ambassadors"
                    blurb="Passionate advocates connecting cultures and championing the spirit of dance."
                />

                <ArtistsSectionComponent
                    year={year}
                    title="Hosts"
                    blurb="Charismatic personalities guiding you through an unforgettable journey of rhythm and energy."
                />

                <ArtistsSectionComponent
                    year={year}
                    title="Event Organizers"
                    blurb="The visionary team orchestrating a seamless and spectacular celebration of dance."
                />
            </div>

            <div className="sticky bottom-12 text-center font-header flex flex-wrap content-end justify-center z-8">
                <Link href="/tickets" className="px-6 cta cta-solid rounded">
                    <span className="h3 text-[1.2rem]">Join Us Now</span>
                </Link>
            </div>
        </div>
    );
}