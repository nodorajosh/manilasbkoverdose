"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Hero from "./hero";
import PayWithPayPalButton from "@/components/pay-with-paypal-button";
import { useCartContext } from "@/contexts/CartContext";
import { useToast } from "@/components/toast-provider";
import WI from "../../assets/images/wise.svg";

type TicketType = {
    _id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    quantity: number;
    sold: number;
    category: string;
    thumbnail?: { dataUrl: string; mime?: string } | null;
    wise?: { enabled: boolean } | null;
};

type WiseModalData = {
    ticketId: string;
    name: string;
    quantity: number;
    paymentLink?: string | null;
    instructions?: string | null;
    orderId?: string | null;
};

const categories = ["all", "festival pass", "single pass", "special workshops", "other events"] as const;

function readableDescription(description?: string) {
    if (!description) return "Pass inclusions and attendance terms are provided by the festival.";
    return description
        .replace(/<[^>]*>/g, " ")
        .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
        .replace(/[—–]/g, ", ")
        .replace(/\s+/g, " ")
        .replace(/\s+([.,!?])/g, "$1")
        .trim();
}

export default function Main() {
    const router = useRouter();
    const { data: session } = useSession();
    const { addToCart, cart } = useCartContext();
    const toast = useToast();
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>("all");
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [wiseModalData, setWiseModalData] = useState<WiseModalData | null>(null);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [localCodes, setLocalCodes] = useState<Record<string, string>>({});
    const [validatingTicketId, setValidatingTicketId] = useState<string | null>(null);
    const [discountInfo, setDiscountInfo] = useState<Record<string, { discountedPrice: number; code: string } | undefined>>({});
    const [validateErrors, setValidateErrors] = useState<Record<string, string>>({});
    const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let mounted = true;
        fetch("/api/tickets")
            .then(async (response) => {
                if (!response.ok) throw new Error("Failed to load tickets");
                return response.json();
            })
            .then((data) => {
                if (!mounted) return;
                const list: TicketType[] = Array.isArray(data) ? data : data.tickets ?? [];
                setTickets(list);
                setQuantities((previous) => Object.fromEntries(list.map((ticket) => [ticket._id, previous[ticket._id] ?? 1])));
            })
            .catch((reason: unknown) => {
                if (mounted) setError(reason instanceof Error ? reason.message : "Failed to load tickets");
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const visibleTickets = useMemo(
        () => selectedCategory === "all" ? tickets : tickets.filter((ticket) => ticket.category === selectedCategory),
        [selectedCategory, tickets],
    );

    const setQuantity = (ticketId: string, quantity: number, maximum: number) => {
        setQuantities((previous) => ({ ...previous, [ticketId]: Math.min(Math.max(1, quantity), Math.max(1, maximum)) }));
    };

    const requestWiseOrder = async (ticket: TicketType) => {
        if (!session?.user) {
            toast.push({ title: "Sign in required", message: "Sign in before payment.", level: "info" });
            router.push("/api/auth/signin");
            return;
        }
        if (!session.user.profileComplete) {
            toast.push({ title: "Complete your profile", message: "Finish your profile before payment.", level: "info" });
            router.push("/user");
            return;
        }
        setWiseModalData({ ticketId: ticket._id, name: ticket.name, quantity: quantities[ticket._id] ?? 1 });
    };

    const createWiseOrder = async () => {
        if (!wiseModalData) return;
        setCreatingOrder(true);
        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: wiseModalData.ticketId, quantity: wiseModalData.quantity }),
            });
            const payload = await response.json().catch(() => null) as { order?: { _id?: string }; paymentLink?: string; depositInstructions?: string; error?: string } | null;
            if (!response.ok) throw new Error(payload?.error ?? "Unable to create Wise order");
            const paymentLink = payload?.paymentLink;
            if (!paymentLink || !/^https?:\/\//i.test(paymentLink)) throw new Error("Wise did not return a valid payment link");
            setWiseModalData((previous) => previous ? { ...previous, orderId: payload?.order?._id ?? null, paymentLink, instructions: payload?.depositInstructions ?? null } : previous);
            window.location.assign(paymentLink);
        } catch (reason: unknown) {
            toast.push({ title: "Wise unavailable", message: reason instanceof Error ? reason.message : "Unable to start Wise checkout", level: "error" });
        } finally {
            setCreatingOrder(false);
        }
    };

    const handleAddToCart = async (ticket: TicketType) => {
        if (addingToCart[ticket._id]) return;
        const quantity = quantities[ticket._id] ?? 1;
        const discount = discountInfo[ticket._id];
        setAddingToCart((previous) => ({ ...previous, [ticket._id]: true }));
        try {
            await addToCart(ticket.name, ticket.price, ticket.currency, ticket._id, quantity, discount?.code ?? null, discount?.discountedPrice ?? null);
            toast.push({ title: "Added to cart", message: `${ticket.name} ×${quantity} is ready.`, level: "success" });
        } catch (reason: unknown) {
            toast.push({ title: "Could not add ticket", message: reason instanceof Error ? reason.message : "Please try again.", level: "error" });
        } finally {
            setAddingToCart((previous) => ({ ...previous, [ticket._id]: false }));
        }
    };

    const validateCode = async (ticketId: string) => {
        const code = (localCodes[ticketId] ?? "").trim();
        if (!code) return;
        setValidatingTicketId(ticketId);
        setValidateErrors((previous) => ({ ...previous, [ticketId]: "" }));
        setDiscountInfo((previous) => ({ ...previous, [ticketId]: undefined }));
        try {
            const response = await fetch("/api/discounts/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId, code }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error ?? "Invalid discount code");
            setDiscountInfo((previous) => ({ ...previous, [ticketId]: { discountedPrice: payload.discountedPrice, code: payload.code } }));
        } catch (reason: unknown) {
            setValidateErrors((previous) => ({ ...previous, [ticketId]: reason instanceof Error ? reason.message : "Validation failed" }));
        } finally {
            setValidatingTicketId(null);
        }
    };

    return (
        <main className="min-h-dvh bg-ink text-white">
            <Hero />
            <section id="ticket-catalog" className="mx-auto w-full max-w-[100rem] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
                <div className="grid gap-8 border-b border-white/30 pb-10 lg:grid-cols-[1fr_.6fr] lg:items-end">
                    <h2 className="font-header text-6xl uppercase leading-[.88] text-white sm:text-8xl">Choose<br /><span className="text-gold">your access.</span></h2>
                    <p className="max-w-lg text-lg leading-8 text-white/70 lg:justify-self-end">Full weekend, single night or specialist workshop. Compare the passes below, then checkout securely when you are ready.</p>
                </div>

                <div className="mt-8 flex flex-wrap gap-2" aria-label="Ticket categories">
                    {categories.map((category) => (
                        <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`filter-pill ${selectedCategory === category ? "filter-pill-active" : ""}`}>{category}</button>
                    ))}
                </div>

                <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {loading && Array.from({ length: 6 }).map((_, index) => <div key={index} className="ticket-skeleton h-[34rem] animate-pulse" />)}
                    {!loading && error && <div className="col-span-full border border-garnet p-6 text-white">{error}</div>}
                    {!loading && !error && visibleTickets.length === 0 && <div className="col-span-full border border-white/30 p-12 text-center text-white/70">No tickets in this collection yet.</div>}
                    {!loading && !error && visibleTickets.map((ticket) => {
                        const remaining = Math.max(0, ticket.quantity - ticket.sold);
                        const cartQuantity = cart.find((item) => item.ticketId === ticket._id)?.quantity ?? 0;
                        const selectable = Math.max(0, remaining - cartQuantity);
                        const quantity = Math.min(Math.max(1, quantities[ticket._id] ?? 1), Math.max(1, selectable));
                        const discount = discountInfo[ticket._id];
                        const soldOut = remaining === 0;
                        return (
                            <article key={ticket._id} className="ticket-card">
                                {ticket.thumbnail?.dataUrl ? <div className="relative aspect-[16/10] overflow-hidden border-b border-white/30"><Image src={ticket.thumbnail.dataUrl} alt={`${ticket.name} ticket`} fill unoptimized className="object-cover" /></div> : <div className="ticket-art border-b border-ink" />}
                                <div className="relative flex flex-1 flex-col p-6">
                                    <div className="flex items-center justify-between gap-3"><span className="eyebrow text-gold">{ticket.category}</span><span className={`stock-label ${soldOut ? "stock-sold" : ""}`}>{soldOut ? "Sold out" : `${remaining} left`}</span></div>
                                    <h3 className="mt-5 font-header text-3xl uppercase leading-none text-white">{ticket.name}</h3>
                                    <details className="ticket-details mt-4 border-y border-white/25 py-3"><summary className="cursor-pointer text-sm font-semibold text-white">Pass details & terms</summary><p className="mt-3 text-base leading-7 text-white/65">{readableDescription(ticket.description)}</p></details>
                                    <div className="mt-6 flex items-end justify-between gap-3"><div><span className="text-xs uppercase tracking-[.12em] text-white/60">From</span><div className="mt-1 font-header text-3xl text-gold">{ticket.currency} {ticket.price.toFixed(2)}</div></div>{discount && <div className="text-right"><span className="text-xs uppercase tracking-[.12em] text-white/60">With code</span><div className="mt-1 text-lg text-gold">{ticket.currency} {discount.discountedPrice.toFixed(2)}</div></div>}</div>
                                    <div className="mt-6 flex items-center justify-between border-y border-white/25 py-3"><span className="text-xs font-semibold uppercase tracking-[.1em] text-white/70">Quantity</span><div className="flex items-center gap-3"><button type="button" onClick={() => setQuantity(ticket._id, quantity - 1, selectable)} disabled={quantity <= 1} className="quantity-button" aria-label={`Decrease ${ticket.name}`}>−</button><span className="w-5 text-center font-semibold">{quantity}</span><button type="button" onClick={() => setQuantity(ticket._id, quantity + 1, selectable)} disabled={quantity >= Math.max(1, selectable)} className="quantity-button" aria-label={`Increase ${ticket.name}`}>+</button></div></div>
                                    <div className="mt-4 flex gap-2"><input value={localCodes[ticket._id] ?? ""} onChange={(event) => { setLocalCodes((previous) => ({ ...previous, [ticket._id]: event.target.value.toUpperCase() })); setValidateErrors((previous) => ({ ...previous, [ticket._id]: "" })); }} placeholder="Promo code" className="field-input" aria-label={`Promo code for ${ticket.name}`} /><button type="button" onClick={() => void validateCode(ticket._id)} disabled={!localCodes[ticket._id] || validatingTicketId === ticket._id} className="filter-pill">{validatingTicketId === ticket._id ? "..." : "Apply"}</button></div>
                                    {discount && <button type="button" onClick={() => setDiscountInfo((previous) => ({ ...previous, [ticket._id]: undefined }))} className="mt-3 text-left text-sm text-gold underline">Remove {discount.code}</button>}
                                    {validateErrors[ticket._id] && <p className="mt-2 text-sm text-[#ff9b82]">{validateErrors[ticket._id]}</p>}
                                    <div className="mt-auto grid gap-2 pt-6"><button type="button" onClick={() => void handleAddToCart(ticket)} disabled={soldOut || selectable === 0 || addingToCart[ticket._id]} className="cta cta-outline w-full px-4 py-3 text-sm">{addingToCart[ticket._id] ? "Adding..." : "Add to cart"}</button><PayWithPayPalButton ticketId={ticket._id} quantity={quantity} discountCode={discount?.code ?? null} className="w-full text-sm" /></div>
                                    {ticket.wise?.enabled && <button type="button" onClick={() => void requestWiseOrder(ticket)} disabled={soldOut || selectable === 0 || Boolean(discount)} className="mt-2 flex w-full items-center justify-center gap-2 border border-gold bg-transparent px-4 py-3 text-sm font-semibold uppercase tracking-[.08em] text-gold transition hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"><span>Reserve with</span><Image src={WI} alt="Wise" width={20} height={20} /><span>Wise</span></button>}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {wiseModalData && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-5" role="dialog" aria-modal="true" aria-labelledby="wise-title" onClick={() => !creatingOrder && setWiseModalData(null)}><div className="w-full max-w-lg border border-gold bg-ink p-7 text-white" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-gold">Manual payment</p><h2 id="wise-title" className="mt-3 font-header text-3xl uppercase">Wise · {wiseModalData.name}</h2><p className="mt-3 text-base leading-7 text-white/70">We create your order first, then take you to the secure Wise payment details.</p></div><button type="button" onClick={() => setWiseModalData(null)} className="focus-ring text-2xl text-white/70 hover:text-gold" aria-label="Close Wise payment dialog">×</button></div><div className="mt-7 flex items-center justify-between border-y border-white/25 p-4"><span className="text-sm text-white/70">Tickets reserved</span><strong>{wiseModalData.quantity}</strong></div>{wiseModalData.instructions && <p className="mt-5 whitespace-pre-wrap border border-white/25 p-4 text-sm leading-6 text-white/70">{wiseModalData.instructions}</p>}<button type="button" onClick={() => void createWiseOrder()} disabled={creatingOrder} className="cta cta-solid mt-6 w-full px-5 py-4 text-sm">{creatingOrder ? "Preparing Wise..." : "Continue to Wise"}</button><button type="button" onClick={() => setWiseModalData(null)} disabled={creatingOrder} className="mt-3 w-full py-2 text-sm text-white/70 hover:text-gold">Keep browsing</button></div></div>}
        </main>
    );
}
