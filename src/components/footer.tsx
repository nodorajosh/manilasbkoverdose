import Link from "next/link";

import CloudinaryLogo from "@/components/cloudinary-logo";
import ArrowIcon from "@/components/arrow-icon";

const socialLinks = [
    { title: "WhatsApp", link: "https://wa.me/639565183562" },
    { title: "Facebook", link: "https://www.facebook.com/profile.php?id=61551057503242" },
    { title: "Instagram", link: "https://www.instagram.com/manilasbkzoverdose" },
    { title: "Campsite.bio", link: "https://campsite.bio/mnlsbkz" },
];

export default function Footer() {
    return (
        <footer className="bg-ink px-5 py-12 text-white sm:px-8 sm:py-16 lg:px-12">
            <div className="mx-auto w-full max-w-[100rem]">
                <div className="grid gap-12 border-b border-white/25 pb-12 md:grid-cols-2 lg:grid-cols-[1.2fr_.8fr_.8fr]">
                    <div>
                        <Link href="/" className="inline-block" aria-label="Manila SBKZ Overdose home">
                            <CloudinaryLogo className="h-auto w-40 sm:w-52" />
                        </Link>
                        <p className="mt-6 max-w-sm text-lg leading-7 text-white/70">Afro-Latin dance, made in Manila. Come move with us.</p>
                    </div>
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-[.14em] text-gold">Find your way</h2>
                        <ul className="mt-5 space-y-3 text-base">
                            <li><Link className="footer-link" href="/#trailer">Festival film</Link></li>
                            <li><Link className="footer-link" href="/#artists">Artist lineup</Link></li>
                            <li><Link className="footer-link" href="/tickets">Tickets</Link></li>
                            <li><Link className="footer-link" href="/user">Your account</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-[.14em] text-gold">Stay in step</h2>
                        <ul className="mt-5 space-y-3 text-base">
                            {socialLinks.map((link) => (
                                <li key={link.title}>
                                    <Link className="footer-link" href={link.link} target="_blank" rel="noopener noreferrer">
                                        {link.title} <ArrowIcon />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col gap-3 pt-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
                    <span>© {new Date().getFullYear()} Manila SBKZ Overdose</span>
                    <Link href="/terms" className="footer-link w-fit">Terms & Privacy</Link>
                </div>
            </div>
        </footer>
    );
}
