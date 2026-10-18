"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { useCartContext } from "@/contexts/CartContext";
import CA from "../../assets/images/cart.svg";
import CartSidebar from "../cart";

const navlinks = [
    { title: "Trailer", link: "/#trailer" },
    { title: "Artists", link: "/#artists" },
];

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            aria-hidden="true"
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
    );
}

function MenuIcon({ open }: { open: boolean }) {
    return (
        <span className="relative block h-5 w-5" aria-hidden="true">
            <span className={`absolute left-0 top-1 block h-px w-5 bg-current transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`absolute left-0 top-3 block h-px w-5 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 top-5 block h-px w-5 bg-current transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
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
        <div ref={navRef} className="relative flex items-center gap-2 text-white">
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
                {navlinks.map((navlink) => (
                    <Link
                        key={navlink.title}
                        href={navlink.link}
                        className="rounded-full px-4 py-2 text-[.68rem] font-semibold uppercase tracking-[.16em] text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white"
                    >
                        {navlink.title}
                    </Link>
                ))}
                <Link href="/tickets" className="cta cta-solid ml-2 px-5 py-2.5 text-[.68rem] uppercase tracking-[.16em]">
                    Tickets
                </Link>
            </nav>

            <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="focus-ring relative grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/75 transition hover:border-[#f3d78a]/60 hover:bg-white/10 hover:text-white"
                aria-label={`Open cart${cartCount ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}
            >
                <Image src={CA} alt="" width={17} height={17} />
                {cartCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#f3d78a] px-1 text-[.62rem] font-bold text-[#241507]">{cartCount}</span>}
            </button>

            {session?.user ? (
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setAccountOpen((open) => !open)}
                        className="focus-ring flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-1.5 pr-3 transition hover:border-[#f3d78a]/60 hover:bg-white/10"
                        aria-expanded={isAccountOpen}
                        aria-haspopup="menu"
                        aria-label="Open account menu"
                    >
                        <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-[#f3d78a] text-xs font-bold text-[#241507]">
                            {session.user.image ? <Image src={session.user.image} alt="" width={28} height={28} className="h-full w-full object-cover" /> : getInitials(session.user.name)}
                        </span>
                        <ChevronIcon open={isAccountOpen} />
                    </button>
                    {isAccountOpen && (
                        <AccountMenu isAdmin={session.user.role === "admin"} closeMenus={closeMenus} />
                    )}
                </div>
            ) : (
                <div className="relative hidden md:block">
                    <button
                        type="button"
                        onClick={() => setAccountOpen((open) => !open)}
                        className="focus-ring flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[.68rem] font-semibold uppercase tracking-[.16em] text-white/70 transition hover:border-[#f3d78a]/60 hover:bg-white/10 hover:text-white"
                        aria-expanded={isAccountOpen}
                        aria-haspopup="menu"
                    >
                        Sign in
                        <ChevronIcon open={isAccountOpen} />
                    </button>
                    {isAccountOpen && <AccountMenu closeMenus={closeMenus} />}
                </div>
            )}

            <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/80 transition hover:border-[#f3d78a]/60 hover:bg-white/10 md:hidden"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
                <MenuIcon open={isMenuOpen} />
            </button>

            {isMenuOpen && (
                <nav id="mobile-navigation" className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#120d18]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
                    <div className="flex flex-col gap-1">
                        {navlinks.map((navlink) => (
                            <Link key={navlink.title} href={navlink.link} onClick={closeMenus} className="rounded-xl px-4 py-3 text-sm uppercase tracking-[.14em] text-white/70 transition hover:bg-white/10 hover:text-white">
                                {navlink.title}
                            </Link>
                        ))}
                        <Link href="/tickets" onClick={closeMenus} className="cta cta-solid mt-2 px-4 py-3 text-center text-sm uppercase tracking-[.14em]">
                            Get your pass
                        </Link>
                        {!session?.user && <Link href="/auth/signin" onClick={closeMenus} className="rounded-xl px-4 py-3 text-sm uppercase tracking-[.14em] text-white/70 transition hover:bg-white/10 hover:text-white">Sign in</Link>}
                        {session?.user && <AccountMenu isAdmin={session.user.role === "admin"} closeMenus={closeMenus} mobile />}
                    </div>
                </nav>
            )}

            {isCartOpen && <CartSidebar onClose={() => setCartOpen(false)} />}
        </div>
    );
}

function AccountMenu({ isAdmin = false, closeMenus, mobile = false }: { isAdmin?: boolean; closeMenus: () => void; mobile?: boolean }) {
    return (
        <div className={mobile ? "mt-1 border-t border-white/10 pt-1" : "absolute right-0 top-[calc(100%+0.75rem)] z-50 w-44 rounded-2xl border border-white/10 bg-[#120d18]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"} role="menu">
            {isAdmin && <Link href="/admin" onClick={closeMenus} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white" role="menuitem">Admin</Link>}
            <Link href="/user" onClick={closeMenus} className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white" role="menuitem">Account</Link>
            <button type="button" onClick={() => { closeMenus(); void signOut({ callbackUrl: "/" }); }} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white" role="menuitem">Sign out</button>
        </div>
    );
}
