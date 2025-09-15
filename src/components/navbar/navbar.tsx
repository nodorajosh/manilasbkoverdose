import Image from "next/image";
import Link from "next/link";



import Navlinks from "./navlinks";

export default function Navbar() {
    return (
        <nav className="w-dvw p-6 flex flex-row flex-wrap justify-between fixed z-12">
            <span className="flex flex-wrap justify-start content-center">
                <Link
                    href="/"
                >
                    <Image src="/images/logo_manilasbkz.png" alt="Manila SBKZ Overdose Logo" width={150} height={150} className="w-[65px] sm:w-[95px] md:w-[150px] h-auto" />
                </Link>
            </span>
            <span className="grid place-items-center">
                <Navlinks />
            </span>
        </nav >
    );
}
