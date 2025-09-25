// components/Main.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

import { useSession } from "next-auth/react";
import { useCartContext } from "@/contexts/CartContext";
import Hero from "./hero";
import Spinner from "@/components/spinner";

import WI from "../../assets/images/wise.svg";

type TicketType = {
    _id: string;
    name: string;
    description?: string;
    price: number; // cents
    currency: string; // e.g. "USD"
    quantity: number;
    sold: number;
    metadata?: Record<string, any> | any; // eslint-disable-line @typescript-eslint/no-explicit-any
    thumbnail?: {
        dataUrl: string;
        size: number;
        mime: string;
        width?: number;
        height?: number;
    } | null;
    wise?: {
        enabled: boolean;
        paymentLink?: string | null;
        depositInstructions?: string | null;
    } | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

export default function Main() {
    const { data: session } = useSession();
    const { addToCart } = useCartContext();

    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for Wise deposit instructions + order creation state
    const [showWiseModal, setShowWiseModal] = useState(false);
    const [wiseModalData, setWiseModalData] = useState<{
        paymentLink?: string | null;
        instructions?: string | null;
        name?: string;
        ticketId?: string;
    } | null>(null);

    const [creatingOrder, setCreatingOrder] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);

    // Fetch tickets from API
    useEffect(() => {
        let mounted = true;
        const fetchTickets = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/tickets");
                if (!res.ok) throw new Error("Failed to load tickets");
                const data = await res.json();
                const list: TicketType[] = Array.isArray(data) ? data : data.tickets ?? data;
                if (mounted) setTickets(list);
            } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error(e);
                if (mounted) setError(e?.message ?? "Failed to load");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchTickets();
        return () => {
            mounted = false;
        };
    }, []);

    const openWiseModal = (ticket: TicketType) => {
        setWiseModalData({
            paymentLink: ticket.wise?.paymentLink ?? null,
            instructions: ticket.wise?.depositInstructions ?? null,
            name: ticket.name,
            ticketId: ticket._id,
        });
        setCreatedOrderId(null);
        setOrderError(null);
        setShowWiseModal(true);
    };

    const closeWiseModal = () => {
        setShowWiseModal(false);
        setWiseModalData(null);
        setCreatingOrder(false);
        setCreatedOrderId(null);
        setOrderError(null);
    };

    // Create order and then open the Wise link
    const createOrderAndOpenWise = async (ticketId?: string, paymentLink?: string | null, instructions?: string | null) => {
        if (!ticketId) return setOrderError("Missing ticket id");
        setOrderError(null);
        setCreatingOrder(true);
        setCreatedOrderId(null);

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticketId,
                    quantity: 1,
                    paymentLink: paymentLink ?? null,
                    depositInstructions: instructions ?? null,
                }),
            });

            const payload = await res.json();

            if (!res.ok) {
                setOrderError(payload?.error || "Failed to create order");
                setCreatingOrder(false);
                return;
            }

            const order = payload.order;
            // store created order id for UI
            setCreatedOrderId(order?._id ?? order?.id ?? null);

            // Open the Wise link (in a new tab) so the user can see bank details
            if (paymentLink) {
                // open in new tab; keep modal open so user sees order id/instructions
                window.open(paymentLink, "_blank", "noopener,noreferrer");
            }

            setCreatingOrder(false);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("create order error", err);
            setOrderError(err?.message || "Failed to create order");
            setCreatingOrder(false);
        }
    };

    return (
        <div className="bg-black text-white min-h-dvh">
            <Hero />
            <div className="w-full h-full px-6 py-12 flex flex-col justify-center items-center">
                {loading && (
                    <span className="flex items-center gap-3">
                        <Spinner />
                        <p className="ml-2 text-gray-400">Loading tickets...</p>
                    </span>
                )}

                {error && <p className="text-red-500">{error}</p>}

                {!error && !loading && (
                    <div className="w-full max-w-7xl">
                        <h1 className="text-2xl font-bold mb-6 text-center">Tickets</h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tickets.map((ticket) => {
                                const remaining = Math.max(0, ticket.quantity - ticket.sold);

                                return (
                                    <div
                                        key={ticket._id}
                                        className="glow border bg-gradient-to-tr from-peach-800 via-neutral-dark to-peach-800 rounded shadow-md flex flex-col justify-between"
                                    >
                                        <div>
                                            {ticket.thumbnail?.dataUrl ? (
                                                <div className="mb-3 w-full flex justify-center">
                                                    <img
                                                        src={ticket.thumbnail.dataUrl}
                                                        alt={`${ticket.name} thumbnail`}
                                                        className="w-full aspect-video object-cover rounded-t-2xl"
                                                    />
                                                </div>
                                            ) : null}

                                            <h2 className="px-4 text-lg font-semibold">{ticket.name}</h2>
                                            {ticket.description && <p className="px-4 text-sm text-gray-300 mb-2">{ticket.description}</p>}

                                            <div className="px-4 flex items-baseline gap-2">
                                                <div className="text-xl font-bold">${ticket.price}</div>
                                                <div className="text-sm text-gray-400"> {ticket.currency}</div>
                                            </div>

                                            <p className="px-4  text-sm text-gray-400 mt-1">{remaining} left</p>
                                        </div>

                                        <div className="mt-4 px-4 pb-4 flex flex-col gap-2">
                                            <button
                                                onClick={() => addToCart(ticket.name, ticket.price, ticket.currency, ticket._id, 1)}
                                                className={`mt-2 cta cta-outline px-4 py-2 rounded-full ${remaining === 0 ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
                                                disabled
                                            >
                                                <h3>Add to Cart</h3>
                                            </button>

                                            {ticket.wise?.enabled && ticket.wise?.paymentLink ? (
                                                <>

                                                    {session?.user ? (
                                                        <>
                                                            {session?.user.profileComplete ? (
                                                                <button
                                                                    onClick={() => openWiseModal(ticket)}
                                                                    className="mt-2 flex items-center justify-center gap-2 cta cta-solid px-4 py-2 rounded-full bg-yellow-500 text-black hover:brightness-95"
                                                                >
                                                                    <span>Buy with</span>
                                                                    <Image src={WI} alt="wise" width={20} height={20} />
                                                                    <span>Wise</span>
                                                                </button>
                                                            ) : (
                                                                <Link href="/profile" className="mt-2 flex items-center justify-center gap-2 cta cta-outline px-4 py-2 rounded-full">
                                                                    <span>Complete your profile to buy with</span>
                                                                    <Image src={WI} alt="wise" width={20} height={20} />
                                                                    <span>Wise</span>
                                                                </Link>
                                                            )}
                                                        </>

                                                    ) : (
                                                        <Link href="/api/auth/signin" className="mt-2 flex items-center justify-center gap-2 cta cta-outline px-4 py-2 rounded-full">
                                                            <span>Sign in to buy with</span>
                                                            <Image src={WI} alt="wise" width={20} height={20} />
                                                            <span>Wise</span>
                                                        </Link>
                                                    )}
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Wise deposit modal */}
            {showWiseModal && wiseModalData && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={closeWiseModal}
                >
                    <div
                        className="bg-white text-black rounded-lg max-w-xl w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Pay with Wise — {wiseModalData.name}</h3>
                                <p className="text-sm text-gray-600">Follow the instructions below to complete your payment.</p>
                            </div>
                            <button onClick={closeWiseModal} aria-label="Close" className="text-gray-600 hover:text-gray-800">✕</button>
                        </div>

                        <div className="mt-4 space-y-4 text-sm">
                            {wiseModalData.instructions ? (
                                <div>
                                    <h4 className="font-medium mb-1">Deposit Instructions</h4>
                                    <div className="prose max-w-none whitespace-pre-wrap text-gray-800">{wiseModalData.instructions}</div>
                                </div>
                            ) : (
                                <div className="text-gray-700">No extra instructions provided. Use the payment link below to see bank details.</div>
                            )}

                            {wiseModalData.paymentLink ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        {createdOrderId ? (
                                            <a
                                                href={wiseModalData.paymentLink}
                                                className="inline-block mt-2 cta cta-solid text-black text-center px-4 py-2 rounded-full bg-yellow-500 hover:brightness-95"
                                                target="_blank"
                                            >
                                                Open Wise Payment Details
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    createOrderAndOpenWise(wiseModalData.ticketId, wiseModalData.paymentLink, wiseModalData.instructions)
                                                }
                                                disabled={creatingOrder}
                                                className="inline-block mt-2 cta cta-solid text-black px-4 py-2 rounded-full bg-yellow-500 hover:brightness-95"
                                            >
                                                {creatingOrder ? "Creating order..." : "Open Wise Payment Details"}
                                            </button>
                                        )}

                                        {createdOrderId && (
                                            <div className="text-sm text-green-700">
                                                Order created: <strong>{createdOrderId}</strong>
                                            </div>
                                        )}
                                    </div>

                                    {orderError && <div className="text-sm text-red-600">{orderError}</div>}

                                    {/* helper link in case the new tab was blocked */}
                                    <div className="text-xs text-gray-600">
                                        If the Wise page did not open automatically, copy & paste this link into a new tab:
                                        <div className="mt-1 break-all">
                                            <a href={wiseModalData.paymentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                                {wiseModalData.paymentLink}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button onClick={closeWiseModal} className="px-4 py-2 rounded bg-gray-200">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
