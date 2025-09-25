import Link from "next/link";

export default function Closing() {
    return (
        <div
            id="preface"
            className="px-6 py-12 relative min-h-[35dvh] grid place-items-center text-white bg-black"
        >
            <h1 className="pb-3 text-2xl text-center">
                <span className="ul">&nbsp;Find Your Beat, Create Your Story&nbsp;</span>
            </h1>
            <p className="max-w-[85ch]">
                This isn&apos;t just an event—it&apos;s your chance to belong, to grow, and to celebrate. Every class, every party, every song brings you closer to something bigger than dance. When the weekend ends, you won&apos;t just remember the music—you&apos;ll remember the friendships, the breakthroughs, and the moments that stay with you long after the lights fade. The floor is waiting. Will you step into it?
            </p>
            <div className="text-center font-header flex flex-wrap content-end justify-center">
                <Link href="/tickets" className="px-6 cta cta-solid rounded pointer-events-none" aira-disabled="true" tabIndex={-1}>
                    <span className="h3 text-[1.2rem]">Join The Festival Now</span>
                </Link>
            </div>
        </div>
    );
}
