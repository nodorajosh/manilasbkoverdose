"use client"

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { useSession, signOut } from "next-auth/react";

import { useCartContext } from "@/contexts/CartContext";
import CA from "../../assets/images/cart.svg";
import CartSidebar from "../cart";


export default function Navlinks() {
    const { data: session } = useSession();

    const { isCartOpen, setCartOpen } = useCartContext();

    const cartRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLLIElement | null>(null);
    const menuCheckboxRef = useRef<HTMLInputElement | null>(null);

    const closeMenu = () => {
        if (menuCheckboxRef.current) {
            menuCheckboxRef.current.checked = false;
        }
    };

    // Close nav menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuCheckboxRef.current?.checked &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                menuCheckboxRef.current.checked = false;
            }
        }

        document.addEventListener("click", handleClickOutside, { capture: true });
        return () => {
            document.removeEventListener("click", handleClickOutside, { capture: true });
        };
    }, []);

    const navlinks = [
        {
            title: "Trailer",
            link: "/#trailer"
        },
        {
            title: "Artists",
            link: "/#artists"
        },
    ]

    const getInitials = (name?: string | null) => {
        if (!name) return "";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0][0]?.toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Close cart sidebar when clicking outside
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
                setCartOpen(false);
            }
        }

        window?.addEventListener("click", handleClick, { capture: true });
        return () => {
            window?.removeEventListener("click", handleClick, { capture: true });
        };
    }, [setCartOpen]);

    return (
        <ul className="px-2 py-1 flex flex-wrap justify-center content-center relative bg-gray-50/20 dark:bg-gray-950/20 shadow backdrop-blur-[7.5px] border-[1px] border-gray-50/10 dark:border-gray-950/10 rounded text-white">
            {navlinks.map((navlink) => (
                <li
                    key={navlink.title}
                    className="w-[70px] md:w-[120px] lg:w-[140px] xl:w-[180px] grid place-items-center"
                >
                    <Link href={navlink.link}>{navlink.title}</Link>
                </li>
            ))}
            <li className="w-[70px] md:w-[120px] lg:w-[140px] xl:w-[180px] grid place-items-center">
                <Link href="/tickets" className="px-3 cta cta-solid rounded w-full grid place-items-center">
                    <span className="h3">Tickets</span>
                </Link>
            </li>

            {/* User avatar if logged in */}
            {session?.user ? (
                <li ref={menuRef} className="ml-2 relative">
                    <input
                        ref={menuCheckboxRef}
                        type="checkbox"
                        id="nav-menu-toggle"
                        className="peer hidden"
                    />
                    {/* Click-outside overlay — clicking anywhere closes the menu */}
                    <label
                        htmlFor="nav-menu-toggle"
                        className="hidden peer-checked:fixed peer-checked:inset-0 peer-checked:z-40 cursor-default"
                        aria-hidden="true"
                    />
                    {/* Trigger */}
                    <label
                        htmlFor="nav-menu-toggle"
                        className="relative z-50 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold overflow-hidden cursor-pointer"
                    >
                        {session.user.image ? (
                            <Image
                                src={session.user.image as string}
                                alt={session.user.name as string || "User"}
                                width={40}
                                height={40}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        ) : (
                            <span>{getInitials(session.user.name)}</span>
                        )}
                    </label>
                    {/* Dropdown menu — animated with opacity + scale + slide */}
                    <div className="absolute top-9 right-0 z-50 px-4 py-8 w-max rounded bg-gray-50/20 dark:bg-gray-950/20 shadow backdrop-blur-[7.5px] border-[1px] border-gray-50/10 dark:border-gray-950/10 opacity-0 scale-95 -translate-y-2 pointer-events-none peer-checked:opacity-100 peer-checked:scale-100 peer-checked:translate-y-0 peer-checked:pointer-events-auto transition-all duration-300 ease-out transform-gpu">
                        <ul className="flex flex-col gap-4">
                            {session?.user.role === "admin" && (
                                <li>
                                    <Link href="/admin" onClick={closeMenu} className="text-neutral-50 hover:text-neutral-200 whitespace-nowrap">Admin</Link>
                                </li>
                            )}
                            <li>
                                <Link href="/user" onClick={closeMenu} className="text-neutral-50 hover:text-neutral-200 whitespace-nowrap">Account</Link>
                            </li>
                            <li>
                                <button className="text-neutral-50 hover:text-neutral-200 cursor-pointer" onClick={() => { closeMenu(); signOut({ callbackUrl: "/" }); }}>Sign Out</button>
                            </li>
                        </ul>
                    </div>
                </li>
            ) : (
                <li ref={menuRef} className="px-4 flex items-center justify-center relative">
                    <input
                        ref={menuCheckboxRef}
                        type="checkbox"
                        id="nav-menu-toggle"
                        className="peer hidden"
                    />
                    {/* Click-outside overlay */}
                    <label
                        htmlFor="nav-menu-toggle"
                        className="hidden peer-checked:block peer-checked:fixed peer-checked:inset-0 peer-checked:z-40 peer-checked:cursor-default"
                        aria-hidden="true"
                    />
                    {/* Trigger — chevron rotates when open */}
                    <label
                        htmlFor="nav-menu-toggle"
                        className="relative z-50 cursor-pointer transition-transform duration-300 ease-out peer-checked:rotate-180"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            role="img"
                            aria-hidden="false"
                            aria-label="Open menu"
                            fill="currentColor"
                        >
                            <path d="M12 16.5c-.25 0-.5-.1-.7-.29l-7.5-7.5a1 1 0 011.41-1.41L12 13.08l6.79-6.78a1 1 0 111.41 1.41l-7.5 7.5c-.2.19-.45.29-.7.29z" />
                        </svg>
                    </label>
                    {/* Dropdown menu — animated with opacity + scale + slide */}
                    <div className="absolute top-9 right-0 z-50 px-4 py-8 w-max rounded bg-gray-50/20 dark:bg-gray-950/20 shadow backdrop-blur-[7.5px] border-[1px] border-gray-50/10 dark:border-gray-950/10 opacity-0 scale-95 -translate-y-2 pointer-events-none peer-checked:opacity-100 peer-checked:scale-100 peer-checked:translate-y-0 peer-checked:pointer-events-auto transition-all duration-300 ease-out transform-gpu">
                        <ul className="flex flex-col gap-4">
                            <li>
                                <Link href="/auth/signin" onClick={closeMenu} className="text-neutral-50 hover:text-neutral-200 whitespace-nowrap">Sign In</Link>
                            </li>
                        </ul>
                    </div>
                </li>
            )}

            <div>
                <div className="absolute -top-6 right-12">
                    <button
                        className="cursor-pointer flex items-center justify-center text-xs"
                        onClick={() => setCartOpen(true)}
                    >
                        Cart
                        <Image
                            className="ml-2"
                            src={CA}
                            alt="Cart"
                            width={15}
                            height={15}
                        />
                    </button>
                </div>

                <div ref={cartRef} className={`w-full absolute top-9 right-0 rounded ${isCartOpen ? "block" : "hidden"}`}>
                    <CartSidebar onClose={() => setCartOpen(false)} />
                </div>
            </div>
        </ul>
    )
}