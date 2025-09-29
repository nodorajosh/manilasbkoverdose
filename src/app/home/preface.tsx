import Link from "next/link";

export default function Preface() {
    return (
        <div
            id="preface"
            className="px-6 py-12 relative min-h-[35dvh] grid place-items-center"
        >
            <h1 className="pb-3 text-2xl text-center">
                <span className="ul">&nbsp;Where the City Moves as One&nbsp;</span>
            </h1>
            <p className="max-w-[85ch]">
                Manila comes alive with the sound of Salsa, Bachata, Kizomba, and Zouk. For three exhilarating days, the festival transforms into a playground of rhythm and connection. Learn from world-class instructors, share unforgettable moments with dancers from around the globe, and let the nights sweep you into music and motion that never let go. This isn&apos;t just a festival—it&apos;s a movement, and you&apos;re at the heart of it.
            </p>
            <div className="text-center font-header flex flex-wrap content-end justify-center">
                <Link href="/tickets" className="px-6 cta cta-solid rounded">
                    <span className="h3 text-[1.2rem]">Grab Your Pass and Let&apos;s Dance</span>
                </Link>
            </div >
        </div >
    );
}
