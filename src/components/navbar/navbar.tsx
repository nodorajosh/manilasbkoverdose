import Image from "next/image";
import Link from "next/link";

import { FIXED_LOGO_URL } from "@/components/cloudinary-logo";

import Navlinks from "./navlinks";

export default function Navbar() {
    return (
        <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-white/25 bg-ink px-4 text-white sm:px-6 lg:px-8">
            <div className="mx-auto flex h-full w-full max-w-[100rem] items-center justify-between gap-4">
                <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Manila SBKZ Overdose home">
                    <Image src={FIXED_LOGO_URL} alt="" width={240} height={80} sizes="48px" className="h-11 w-auto object-contain" priority />
                    <span className="hidden font-header text-lg uppercase leading-none tracking-normal text-white min-[420px]:block sm:text-xl">MNL SBKZ<br /><span className="text-gold">Overdose</span></span>
                </Link>
                <Navlinks />
            </div>
        </header>
    );
}
