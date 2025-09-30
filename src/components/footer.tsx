// components/Footer.tsx (updated)
import Image from "next/image";
import Link from "next/link";

import WA from "../assets/images/wa.svg";
import FB from "../assets/images/fb.svg";
import IG from "../assets/images/ig.svg";
import LI from "../assets/images/link.svg";

export default function Footer() {
    const navlinks = [
        {
            title: "Phone",
            content: "+63 956 518 3562",
            link: "https://wa.me/639565183562",
            image: WA,
        },
        {
            title: "Facebook",
            content: "Manila SBKZ Overdose",
            link: "https://www.facebook.com/profile.php?id=61551057503242",
            image: FB,
        },
        {
            title: "Instagram",
            content: "Manila SBKZ Overdose",
            link: "https://www.instagram.com/manilasbkzoverdose",
            image: IG,
        },
        {
            title: "Campsite.bio",
            content: "campsite.bio/mnlsbkz",
            link: "https://campsite.bio/mnlsbkz ",
            image: LI,
        },
    ];

    return (
        <nav className="w-full p-6 block md:flex justify-between content-center bg-black text-white font-body font-light">
            {/* Logo */}
            <div className="grid place-items-center">
                <Link href="/" className="block">
                    <Image
                        src="/images/logo_manilasbkz.png"
                        alt="Manila SBKZ Overdose Logo"
                        width={150}
                        height={150}
                        className="w-[65px] sm:w-[95px] md:w-[150px] h-auto"
                    />
                </Link>

                {/* Terms link under logo for visibility */}
                <div className="mt-2 text-center text-xs">
                    <Link
                        href="/terms"
                        className="underline text-gray-300 hover:text-white"
                    >
                        Terms & Privacy
                    </Link>
                </div>
            </div>

            {/* Tagline + Copyright */}
            <p className="p-6 grid md:w-3/12 place-items-center text-center">
                Where Passion Meets Rhythm, and the World Dances as One.
                <br />
                <br />
                <small>© {new Date().getFullYear()} Manila SBKZ Overdose</small>
            </p>

            {/* Social / contact icons */}
            <ul className="flex flex-col lg:flex-row md:h-auto content-center">
                {navlinks.map((navlink) => (
                    <li key={navlink.title} className="px-4 grid place-items-center">
                        <Link
                            className="flex flex-wrap justify-center content-center"
                            href={navlink.link}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Image
                                className="p-4 w-[50px] md:w-[75px] h-auto"
                                src={navlink.image}
                                alt={navlink.title}
                                width={75}
                                height={75}
                            />
                            <div className="flex flex-wrap justify-center content-center">
                                {navlink.content}
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
