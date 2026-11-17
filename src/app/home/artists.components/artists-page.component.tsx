"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ArtistYear, fetchArtistFolders } from "@/lib/fetch-artists";
import ArrowIcon from "@/components/arrow-icon";

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
    "Main Artists": "The artists setting the pace in workshops, shows and socials.",
    "Additional International Artists": "More perspectives, more techniques, more ways into the music.",
    "Local Artists": "The homegrown dancers who give Manila its unmistakable pulse.",
    Performers: "The acts ready to stop the room and start the next conversation.",
    DJs: "The selectors keeping your feet busy long after the last workshop.",
    Ambassadors: "Dancers connecting the local floor to the global community.",
    Hosts: "Your guides through the weekend, from first hello to final song.",
    "Event Organizers": "The people building the rooms, the schedule and the experience.",
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
        <section id="artists" className="bg-ink py-16 text-paper sm:py-24">
            <div className="mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <h2 className="section-title font-header uppercase">Meet the<br /><span className="text-gold">movement.</span></h2>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-paper/70">From international guests to the local artists who make Manila move. Pick an edition, then swipe through the people behind the music.</p>
                    </div>
                    <label className="flex w-full flex-col gap-2 text-xs font-semibold uppercase tracking-[.12em] text-paper/80 sm:w-64">
                        Choose an edition
                        <select value={year} onChange={(event) => setYear(event.target.value)} disabled={years.length === 0} className="border border-white/35 bg-ink px-4 py-4 text-base font-medium normal-case tracking-normal text-paper outline-none focus:border-gold focus:bg-midnight">
                            {years.length === 0 ? <option value="">Loading...</option> : [...years].reverse().map((item) => <option key={item.path} value={item.name}>{editionLabel(item.name)}</option>)}
                        </select>
                    </label>
                </div>
                <div className="mt-12 flex flex-col gap-2 border-y border-gold bg-gold px-5 py-5 text-ink sm:flex-row sm:items-end sm:justify-between">
                    <h3 className="font-header text-3xl uppercase sm:text-4xl">{edition}</h3>
                    <span className="text-xs font-semibold uppercase tracking-[.12em] text-ink/70">{year || "Manila SBKZ Overdose"} · Manila, Philippines</span>
                </div>
            </div>
            <div>
                {categories.map((category) => {
                    const title = formatCategoryName(category.name);
                    return <ArtistsSectionComponent key={category.path} year={year} category={category.name} title={title} blurb={CATEGORY_BLURBS[category.name] ?? "Artists shaping this year's dance floor."} />;
                })}
            </div>
            <div className="mx-auto mt-12 flex w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
                <Link href="/tickets" className="cta cta-solid px-6 py-4 text-sm">Dance with them <ArrowIcon /></Link>
            </div>
        </section>
    );
}
