import Link from "next/link";

export default function Closing() {
    return (
        <div
            id="preface"
            className="px-5 py-10 relative min-h-[35dvh] grid place-items-center text-white bg-black"
        >
            <h1 className="pb-3 text-2xl text-center">
                <span className="ul">&nbsp;Don't Just Dance, Unleash Your Passion&nbsp;</span>
            </h1>
            <p className="max-w-[85ch]">
                This isn&apos;t just another dance festival—it&apos;s a movement, a celebration, a memory waiting to happen. When the last beat drops, and the lights dim, you&apos;ll leave with more than just techniques. You&apos;ll carry the connections, the confidence, and the stories you created. The dance floor is calling. Are you ready to answer?
            </p>
            <div className="text-center font-header flex flex-wrap content-end justify-center">
                <Link href="https://ticket.manilasbkoverdose.com/" className="px-5 cta rounded">
                    <span className="h3 text-[1.2rem]">Join The Festival Now</span>
                </Link>
            </div>
        </div>
    );
}
