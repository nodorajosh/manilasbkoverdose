import Image from "next/image";
import Link from "next/link";



import Navlinks from "./navlinks";

export default function Navbar() {
    return (
        <>
            <nav className="p-6 flex flex-row flex-wrap justify-start content-center fixed top-0 left-0 z-12">
                <Link
                    href="/"
                >
                    <Image src="/images/logo_manilasbkz.png" alt="Manila SBKZ Overdose Logo" width={150} height={150} className="w-[65px] sm:w-[95px] md:w-[150px] h-auto" />
                </Link>
            </nav >
            <nav className="p-6 flex flex-row flex-wrap justify-start content-center fixed top-0 right-0 z-12">
                <span className="h-[calc(73.23/150*65px)] sm:h-[calc(73.23/150*95px)] md:h-[calc(73.23/150*150px)] grid place-items-center">
                    <Navlinks />
                </span>
            </nav>
        </>
    );
}
