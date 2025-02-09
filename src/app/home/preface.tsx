import Link from "next/link";

export default function Preface() {
    return (
        <div
            id="preface"
            className="px-5 py-10 relative min-h-[35dvh] grid place-items-center"
        >
            <h1 className="pb-3 text-2xl text-center">
                <span className="ul">&nbsp;Step Into The Rhythm and Feel The Energy&nbsp;</span>
            </h1>
            <p className="max-w-[85ch]">
                We don&apos;t just dance—we connect, grow, and celebrate. Whether you're a seasoned performer or a curious beginner, this is your stage, your playground, your community. Over three exhilarating days, you&apos;ll learn from world-class instructors, mingle with fellow dance enthusiasts, and lose yourself in nights brimming with music and motion.
            </p>
            <div className="text-center font-header flex flex-wrap content-end justify-center">
                <Link href="https://ticket.manilasbkoverdose.com/" className="px-5 cta rounded">
                    <span className="h3 text-[1.2rem]">Grab Your Pass and Let’s Dance</span>
                </Link>
            </div>
        </div>
    );
}
