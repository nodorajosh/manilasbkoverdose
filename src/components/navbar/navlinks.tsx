"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { useCartContext } from "@/contexts/CartContext";
import ArrowIcon from "@/components/arrow-icon";
import CA from "../../assets/images/cart.svg";
import CartSidebar from "../cart";

const navlinks = [
    { title: "The weekend", link: "/#preface" },
    { title: "Film", link: "/#trailer" },
    { title: "Lineup", link: "/#artists" },
];

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
    );
}

function MenuIcon({ open }: { open: boolean }) {
    return (
        <span className="relative block h-5 w-5" aria-hidden="true">
            <span className={`absolute left-0 top-1 block h-0.5 w-5 bg-current transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`absolute left-0 top-3 block h-0.5 w-5 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 top-5 block h-0.5 w-5 bg-current transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </span>
    );
}

export default function Navlinks() {
    const { data: session } = useSession();
    const { cart, isCartOpen, setCartOpen } = useCartContext();
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isAccountOpen, setAccountOpen] = useState(false);
    const navRef = useRef<HTMLDivElement | null>(null);
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                setAccountOpen(false);
                setCartOpen(false);
            }
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
                setAccountOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("click", handleClickOutside, true);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("click", handleClickOutside, true);
        };
    }, [setCartOpen]);

    const closeMenus = () => {
        setMenuOpen(false);
        setAccountOpen(false);
    };

    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        const parts = name.trim().split(" ").filter(Boolean);
        if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U";
        return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    };

    return (
        <div ref={navRef} className="relative flex items-center gap-2 text-white sm:gap-3">
            <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
                {navlinks.map((navlink) => (
                    <Link key={navlink.title} href={navlink.link} className="nav-link py-3 text-xs font-semibold uppercase tracking-[.1em] text-white/80">
                        {navlink.title}
                    </Link>
                ))}
                <Link href="/tickets" className="cta cta-solid ml-1 px-5 py-3 text-xs">Tickets <ArrowIcon /></Link>
            </nav>

            <button type="button" onClick={() => setCartOpen(true)} className="focus-ring relative grid h-10 w-10 place-items-center border border-white/30 text-white transition hover:border-gold hover:text-gold" aria-label={`Open cart${cartCount ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}>
                <Image src={CA} alt="" width={17} height={17} />
                {cartCount > 0 && <span className="absolute -right-2 -top-2 grid min-h-5 min-w-5 place-items-center bg-gold px-1 text-[.68rem] font-bold text-ink">{cartCount}</span>}
            </button>

            {session?.user ? (
                <div className="relative">
                    <button type="button" onClick={() => setAccountOpen((open) => !open)} className="focus-ring flex h-10 items-center gap-2 border border-white/30 px-1.5 pr-2 transition hover:border-gold" aria-expanded={isAccountOpen} aria-haspopup="menu" aria-label="Open account menu">
                        <span className="grid h-7 w-7 place-items-center overflow-hidden bg-gold text-xs font-bold text-ink">
                            {session.user.image ? <Image src={session.user.image} alt="" width={28} height={28} className="h-full w-full object-cover" /> : getInitials(session.user.name)}
                        </span>
                        <ChevronIcon open={isAccountOpen} />
                    </button>
                    {isAccountOpen && <AccountMenu isAdmin={session.user.role === "admin"} closeMenus={closeMenus} />}
                </div>
            ) : (
                <Link href="/auth/signin" className="nav-link hidden py-3 text-xs font-semibold uppercase tracking-[.1em] text-white/80 md:block">Sign in</Link>
            )}

            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="focus-ring grid h-10 w-10 place-items-center border border-white/30 text-white transition hover:border-gold hover:text-gold md:hidden" aria-expanded={isMenuOpen} aria-controls="mobile-navigation" aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}>
                <MenuIcon open={isMenuOpen} />
            </button>

            {isMenuOpen && (
                <nav id="mobile-navigation" className="fixed inset-x-0 bottom-0 top-20 z-50 flex flex-col overflow-y-auto bg-gold px-5 py-8 text-ink md:hidden" aria-label="Mobile navigation">
                    <div className="flex flex-col">
                        {navlinks.map((navlink) => (
                            <Link key={navlink.title} href={navlink.link} onClick={closeMenus} className="border-b border-ink py-5 font-header text-4xl uppercase leading-none">
                                {navlink.title}
                            </Link>
                        ))}
                    </div>
                    <Link href="/tickets" onClick={closeMenus} className="cta cta-dark mt-8 px-5 py-4 text-center text-sm">Get your pass <ArrowIcon /></Link>
                    {!session?.user && <Link href="/auth/signin" onClick={closeMenus} className="mt-5 py-3 text-sm font-semibold uppercase tracking-[.1em]">Sign in to your account</Link>}
                    {session?.user && <AccountMenu isAdmin={session.user.role === "admin"} closeMenus={closeMenus} mobile />}
                </nav>
            )}

            {isCartOpen && <CartSidebar onClose={() => setCartOpen(false)} />}
        </div>
    );
}

function AccountMenu({ isAdmin = false, closeMenus, mobile = false }: { isAdmin?: boolean; closeMenus: () => void; mobile?: boolean }) {
    return (
        <div className={mobile ? "mt-6 border-t border-ink pt-3" : "absolute right-0 top-[calc(100%+0.75rem)] z-50 w-48 border border-white/30 bg-ink p-2 text-white"} role="menu">
            {isAdmin && <Link href="/admin" onClick={closeMenus} className="block px-3 py-3 text-sm transition hover:bg-gold hover:text-ink" role="menuitem">Admin</Link>}
            <Link href="/user" onClick={closeMenus} className="block px-3 py-3 text-sm transition hover:bg-gold hover:text-ink" role="menuitem">Account</Link>
            <button type="button" onClick={() => { closeMenus(); void signOut({ callbackUrl: "/" }); }} className="block w-full px-3 py-3 text-left text-sm transition hover:bg-gold hover:text-ink" role="menuitem">Sign out</button>
        </div>
    );
}
