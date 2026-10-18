"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ArtistYear, fetchArtistFolders } from "@/lib/fetch-artists";

import ArtistsSectionComponent from "./artist-section.component";

const FIRST_EDITION_YEAR = 2023;
const CATEGORY_ORDER = [
    "Main Artists",
    "Additional International Artists",
    "Local Artists",
    "Performers",
    "DJs",
    "Ambassadors",
    "Hosts",
    "Event Organizers",
];

const CATEGORY_BLURBS: Record<string, string> = {
    "Main Artists": "World-renowned talents bringing electrifying performances and unmatched expertise to the stage.",
    "Additional International Artists": "Global sensations adding flair and diversity to the festival's vibrant lineup.",
    "Local Artists": "Homegrown stars showcasing the heart and soul of the Filipino dance community.",
    Performers: "Dynamic acts guaranteed to captivate and inspire every step of the way.",
    DJs: "Masterminds behind the beats, setting the perfect tempo for unforgettable nights.",
    Ambassadors: "Passionate advocates connecting cultures and championing the spirit of dance.",
    Hosts: "Charismatic personalities guiding you through an unforgettable journey of rhythm and energy.",
    "Event Organizers": "The visionary team orchestrating a seamless and spectacular celebration of dance.",
};

function editionLabel(year: string) {
    const parsedYear = Number(year);
    const edition = Number.isFinite(parsedYear) ? Math.max(1, parsedYear - FIRST_EDITION_YEAR) : 1;
    const lastTwoDigits = edition % 100;
    const lastDigit = edition % 10;
    const suffix = lastTwoDigits >= 11 && lastTwoDigits <= 13
        ? "th"
        : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[lastDigit] ?? "th";

    return `${edition}${suffix} Edition`;
}

function formatCategoryName(name: string) {
    return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ArtistsPageComponent() {
    const [years, setYears] = useState<ArtistYear[]>([]);
    const [year, setYear] = useState("");

    useEffect(() => {
        let active = true;

        fetchArtistFolders().then((nextYears) => {
            if (!active) return;

            setYears(nextYears);
            setYear((currentYear) => nextYears.some((item) => item.name === currentYear)
                ? currentYear
                : nextYears.at(-1)?.name ?? "");
        });

        return () => {
            active = false;
        };
    }, []);

    const selectedYear = years.find((item) => item.name === year);
    const categories = [...(selectedYear?.categories ?? [])].sort((a, b) => {
        const aIndex = CATEGORY_ORDER.indexOf(formatCategoryName(a.name));
        const bIndex = CATEGORY_ORDER.indexOf(formatCategoryName(b.name));
        return (aIndex === -1 ? CATEGORY_ORDER.length : aIndex) - (bIndex === -1 ? CATEGORY_ORDER.length : bIndex);
    });
    const edition = year ? editionLabel(year) : "Loading lineup";

    return (
        <section id="artists" className="relative overflow-hidden bg-[#0d0a12] py-20 text-white sm:py-28">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:px-12">
                <div className="flex flex-col justify-between gap-7 border-b border-white/10 pb-10 lg:flex-row lg:items-end">
                    <div className="max-w-2xl">
                        <p className="eyebrow text-[#f3d78a]">The lineup</p>
                        <h2 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Meet the energy.</h2>
                        <p className="mt-5 max-w-xl text-base leading-7 text-white/55">From global headliners to the local artists who make Manila move, this is the circle around the dance floor.</p>
                    </div>
                    <label className="flex items-center gap-3 text-sm text-white/55">
                        Edition
                        <select value={year} onChange={(event) => setYear(event.target.value)} disabled={years.length === 0} className="rounded-full border border-white/15 bg-white/[.06] px-4 py-3 text-white outline-none focus:border-[#f3d78a]">
                            {years.length === 0 ? <option value="" className="bg-[#17101f]">Loading...</option> : [...years].reverse().map((item) => <option key={item.path} value={item.name} className="bg-[#17101f]">{editionLabel(item.name)}</option>)}
                        </select>
                    </label>
                </div>
                <div className="rounded-[1.75rem] border border-[#f3d78a]/25 bg-[radial-gradient(circle_at_85%_10%,rgba(243,215,138,.18),transparent_25%),linear-gradient(120deg,rgba(91,35,112,.45),rgba(255,255,255,.03))] p-6 sm:p-8"><p className="eyebrow text-[#bff4df]">Manila SBKZ Overdose</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><h3 className="text-3xl font-semibold tracking-[-.04em] sm:text-5xl">{edition}</h3><span className="text-sm text-white/45">{year || "—"} · Manila, Philippines</span></div></div>
            </div>
            <div className="mt-10">
                {categories.map((category) => {
                    const title = formatCategoryName(category.name);
                    return <ArtistsSectionComponent key={category.path} year={year} category={category.name} title={title} blurb={CATEGORY_BLURBS[category.name] ?? "Artists shaping the energy and spirit of this year's celebration."} />;
                })}
            </div>
            <div className="mt-12 flex justify-center"><Link href="/tickets" className="cta cta-solid px-6 py-3.5 text-sm uppercase tracking-[.14em]">Join the movement</Link></div>
        </section>
    );
}
