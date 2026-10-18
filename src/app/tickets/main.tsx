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
    if (!description) return "A full night of movement, connection, and unforgettable energy.";
    return description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
        <main className="min-h-dvh bg-[#09070d] text-white">
            <Hero />
            <section id="ticket-catalog" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
                <div className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="eyebrow text-[#f3d78a]">Choose your access</p>
                        <h2 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Make your entrance.</h2>
                        <p className="mt-5 max-w-xl text-base leading-7 text-white/60">Secure your place in the room. Pick a pass, set your quantity, and checkout when your lineup feels right.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[24rem]">
                        <div className="stat-card"><strong>{tickets.length}</strong><span>ticket types</span></div>
                        <div className="stat-card"><strong>01</strong><span>weekend</span></div>
                        <div className="stat-card"><strong>∞</strong><span>memories</span></div>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-2" aria-label="Ticket categories">
                    {categories.map((category) => (
                        <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`filter-pill ${selectedCategory === category ? "filter-pill-active" : ""}`}>{category}</button>
                    ))}
                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {loading && Array.from({ length: 6 }).map((_, index) => <div key={index} className="ticket-skeleton h-[34rem] animate-pulse" />)}
                    {!loading && error && <div className="col-span-full rounded-3xl border border-[#f08b9a]/30 bg-[#f08b9a]/10 p-6 text-[#ffd9de]">{error}</div>}
                    {!loading && !error && visibleTickets.length === 0 && <div className="col-span-full rounded-3xl border border-white/10 bg-white/[.03] p-12 text-center text-white/60">No tickets in this collection yet.</div>}
                    {!loading && !error && visibleTickets.map((ticket, index) => {
                        const remaining = Math.max(0, ticket.quantity - ticket.sold);
                        const cartQuantity = cart.find((item) => item.ticketId === ticket._id)?.quantity ?? 0;
                        const selectable = Math.max(0, remaining - cartQuantity);
                        const quantity = Math.min(Math.max(1, quantities[ticket._id] ?? 1), Math.max(1, selectable));
                        const discount = discountInfo[ticket._id];
                        const soldOut = remaining === 0;
                        return (
                            <article key={ticket._id} className={`ticket-card ${index === 0 ? "ticket-card-featured" : ""}`}>
                                <div className="ticket-card-glow" />
                                {ticket.thumbnail?.dataUrl ? <div className="relative aspect-[16/10] overflow-hidden"><Image src={ticket.thumbnail.dataUrl} alt={`${ticket.name} ticket`} fill unoptimized className="object-cover transition duration-700 hover:scale-105" /></div> : <div className="ticket-art" />}
                                <div className="relative flex flex-1 flex-col p-6 sm:p-7">
                                    <div className="flex items-center justify-between gap-3"><span className="eyebrow text-[#f3d78a]">{ticket.category}</span><span className={`stock-label ${soldOut ? "stock-sold" : ""}`}>{soldOut ? "Sold out" : `${remaining} left`}</span></div>
                                    <h3 className="mt-4 text-2xl font-semibold tracking-[-.03em]">{ticket.name}</h3>
                                    <p className="mt-3 min-h-14 text-sm leading-6 text-white/55">{readableDescription(ticket.description)}</p>
                                    <div className="mt-6 flex items-end justify-between gap-3"><div><span className="text-xs uppercase tracking-[.18em] text-white/40">From</span><div className="mt-1 text-3xl font-semibold text-[#f3d78a]">{ticket.currency} {ticket.price.toFixed(2)}</div></div>{discount && <div className="text-right"><span className="text-xs uppercase tracking-[.18em] text-white/40">With code</span><div className="mt-1 text-lg text-[#bff4df]">{ticket.currency} {discount.discountedPrice.toFixed(2)}</div></div>}</div>
                                    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-2"><span className="pl-3 text-xs uppercase tracking-[.16em] text-white/45">Quantity</span><div className="flex items-center gap-3"><button type="button" onClick={() => setQuantity(ticket._id, quantity - 1, selectable)} disabled={quantity <= 1} className="quantity-button" aria-label={`Decrease ${ticket.name}`}>−</button><span className="w-5 text-center font-semibold">{quantity}</span><button type="button" onClick={() => setQuantity(ticket._id, quantity + 1, selectable)} disabled={quantity >= Math.max(1, selectable)} className="quantity-button" aria-label={`Increase ${ticket.name}`}>+</button></div></div>
                                    <div className="mt-4 flex gap-2"><input value={localCodes[ticket._id] ?? ""} onChange={(event) => { setLocalCodes((previous) => ({ ...previous, [ticket._id]: event.target.value.toUpperCase() })); setValidateErrors((previous) => ({ ...previous, [ticket._id]: "" })); }} placeholder="Promo code" className="field-input" aria-label={`Promo code for ${ticket.name}`} /><button type="button" onClick={() => void validateCode(ticket._id)} disabled={!localCodes[ticket._id] || validatingTicketId === ticket._id} className="filter-pill">{validatingTicketId === ticket._id ? "..." : "Apply"}</button></div>
                                    {discount && <button type="button" onClick={() => setDiscountInfo((previous) => ({ ...previous, [ticket._id]: undefined }))} className="mt-2 text-left text-xs text-[#f3d78a]">Remove {discount.code}</button>}
                                    {validateErrors[ticket._id] && <p className="mt-2 text-xs text-[#f08b9a]">{validateErrors[ticket._id]}</p>}
                                    <div className="mt-auto grid gap-2 pt-6"><button type="button" onClick={() => void handleAddToCart(ticket)} disabled={soldOut || selectable === 0 || addingToCart[ticket._id]} className="cta cta-outline w-full px-4 py-3 text-sm uppercase tracking-[.12em]">{addingToCart[ticket._id] ? "Adding..." : "Add to cart"}</button><PayWithPayPalButton ticketId={ticket._id} quantity={quantity} discountCode={discount?.code ?? null} className="w-full text-sm uppercase tracking-[.12em]" /></div>
                                    {ticket.wise?.enabled && <button type="button" onClick={() => void requestWiseOrder(ticket)} disabled={soldOut || selectable === 0 || Boolean(discount)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[#bff4df]/30 bg-[#bff4df]/10 px-4 py-3 text-sm uppercase tracking-[.12em] text-[#bff4df] transition hover:bg-[#bff4df]/20 disabled:cursor-not-allowed disabled:opacity-40"><span>Reserve with</span><Image src={WI} alt="Wise" width={20} height={20} /><span>Wise</span></button>}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {wiseModalData && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="wise-title" onClick={() => !creatingOrder && setWiseModalData(null)}><div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#17101f] p-7 shadow-2xl shadow-black/60" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-[#bff4df]">Manual payment</p><h2 id="wise-title" className="mt-2 text-2xl font-semibold">Wise · {wiseModalData.name}</h2><p className="mt-2 text-sm leading-6 text-white/55">We create your order first, then take you to the secure Wise payment details.</p></div><button type="button" onClick={() => setWiseModalData(null)} className="focus-ring text-2xl text-white/50 hover:text-white" aria-label="Close Wise payment dialog">×</button></div><div className="mt-7 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] p-4"><span className="text-sm text-white/55">Tickets reserved</span><strong>{wiseModalData.quantity}</strong></div>{wiseModalData.instructions && <p className="mt-5 whitespace-pre-wrap rounded-2xl border border-[#bff4df]/20 bg-[#bff4df]/5 p-4 text-sm leading-6 text-white/70">{wiseModalData.instructions}</p>}<button type="button" onClick={() => void createWiseOrder()} disabled={creatingOrder} className="cta cta-solid mt-6 w-full px-5 py-3.5 text-sm uppercase tracking-[.14em]">{creatingOrder ? "Preparing Wise..." : "Continue to Wise"}</button><button type="button" onClick={() => setWiseModalData(null)} disabled={creatingOrder} className="mt-3 w-full py-2 text-sm text-white/45 hover:text-white">Keep browsing</button></div></div>}
        </main>
    );
}
