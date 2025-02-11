import Image from "next/image";
import Link from "next/link";

// import Logo from "../assets/images/logo_manilasbk.png"

export default function Navbar() {
    const navlinks = [
        {
            title: "Trailer",
            link: "#trailer"
        },
        {
            title: "Artists",
            link: "#artists"
        },
    ]

    return (
        <nav className="w-dvw p-6 flex flex-row flex-wrap justify-between fixed z-12">
            <span className="flex flex-wrap justify-start content-center">
                <Link
                    href="#"
                >
                    <Image src="/images/logo_manilasbk.png" alt="Manila SBK Overdose Logo" width={150} height={150} className="w-[65px] sm:w-[95px] md:w-[150px] h-auto" />
                </Link>
            </span>
            <span className="grid place-items-center">
                <ul className="px-2 py-1 flex flex-wrap justify-center content-center glass rounded text-white">
                    {navlinks.map((navlink) => (
                        <li
                            key={navlink.title}
                            className="w-[70px] md:w-[120px] lg:w-[140px] xl:w-[180px] grid place-items-center"
                        >
                            <Link href={navlink.link}>{navlink.title}</Link>
                        </li>
                    ))}
                    <li className="w-[70px] md:w-[120px] lg:w-[140px] xl:w-[180px] grid place-items-center">
                        <Link href="https://ticket.manilasbkoverdose.com/" className="px-3 cta rounded w-full grid place-items-center">
                            <span className="h3">Tickets</span>
                        </Link>
                    </li>
                </ul>
            </span>
        </nav>
    );
}
