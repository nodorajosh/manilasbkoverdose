import Image from "next/image";
import Link from "next/link";

import { FIXED_LOGO_URL } from "@/components/cloudinary-logo";

import Navlinks from "./navlinks";

export default function Navbar() {
    return (
        <header className="fixed inset-x-0 top-0 z-40 px-4 py-4 sm:px-6 sm:py-5">
            <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#09070d]/70 px-3 py-2 shadow-2xl shadow-black/20 backdrop-blur-xl sm:px-4">
                <Link href="/" className="rounded-lg p-2 transition hover:opacity-80" aria-label="Manila SBKZ Overdose home">
                    <Image src={FIXED_LOGO_URL} alt="Manila SBKZ Overdose home" width={240} height={80} sizes="(min-width: 768px) 50px, (min-width: 640px) 84px, 64px" className="h-auto w-12 object-contain" priority />
                </Link>
                <Navlinks />
            </div>
        </header>
    );
}
