"use client"

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { useSession, signOut } from "next-auth/react";

import CA from "../../assets/images/cart.svg";
import CartSidebar from "../cart";
import { Provider } from "../providers";

export default function Navlinks() {
    const { data: session } = useSession();

    const [open, setOpen] = useState(false)
    const [openCart, setOpenCart] = useState(false)

    const ref = useRef<HTMLDivElement | null>(null);

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

    const getInitials = (name?: string | null) => {
        if (!name) return "";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0][0]?.toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            const el = ref?.current;

            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(event.target as Node)) {
                return;
            }

            setOpen(false)
        }

        window?.addEventListener("click", handleClick, { capture: true });
        return () => {
            window?.removeEventListener("click", handleClick, { capture: true });
        };
    }, []);

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
                <Link href="/tickets" className="px-3 cta rounded w-full grid place-items-center">
                    <span className="h3">Tickets</span>
                </Link>
            </li>

            {/* User avatar if logged in */}
            {session?.user ? (
                <li className="ml-2">
                    <button className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold overflow-hidden"
                        onClick={() => (setOpen(prev => !prev))}
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
                    </button>
                </li>
            ) : (
                <li className="px-4 flex items-center justify-center">
                    <button
                        onClick={() => (setOpen(prev => !prev))}
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
                            {/* Downward-pointing (inverted) triangle */}
                            <path d="M12 16.5c-.25 0-.5-.1-.7-.29l-7.5-7.5a1 1 0 011.41-1.41L12 13.08l6.79-6.78a1 1 0 111.41 1.41l-7.5 7.5c-.2.19-.45.29-.7.29z" />
                        </svg>
                    </button>
                </li>
            )}

            <div>
                <div ref={ref} className={`px-4 py-8 w-full absolute top-9 right-0 rounded bg-gray-50/20 dark:bg-gray-950/20 shadow backdrop-blur-[7.5px] border-[1px] border-gray-50/10 dark:border-gray-950/10 ${open ? "block" : "hidden"}`}>
                    <ul className="flex flex-col gap-4">
                        {session?.user ? (
                            <>
                                {session?.user.role === "admin" && (
                                    <li>
                                        <Link href={`/admin/${session.user.email}`} className="text-neutral-50 hover:text-neutral-200">Admin</Link>
                                    </li>
                                )}
                                <li>
                                    <Link href={`/user/${session.user.email}`} className="text-neutral-50 hover:text-neutral-200">Dashboard</Link>
                                </li>
                                <li>
                                    <button className="text-neutral-50 hover:text-neutral-200 cursor-pointer" onClick={() => signOut({ callbackUrl: "/" })}>Sign Out</button>
                                </li>
                            </>
                        ) : (
                            <li>
                                <Link href="/auth/signin" className="text-neutral-50 hover:text-neutral-200">Sign In</Link>
                            </li>
                        )}
                    </ul>
                </div>

                <div className="absolute -top-6 right-12">
                    <button
                        className="cursor-pointer flex items-center justify-center text-xs"
                        onClick={() => setOpenCart(true)}
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

                <Provider>
                    <CartSidebar isOpen={openCart} onClose={() => setOpenCart(false)} />
                </Provider>
            </div>
        </ul>
    )
}