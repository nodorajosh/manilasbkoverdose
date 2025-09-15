"use client";

import { useState, useEffect } from "react";

import { useCartContext } from "@/contexts/CartContext";
import Hero from "./hero";
import Spinner from "@/components/spinner";

type TicketType = {
    _id: string; // or mongoose.Types.ObjectId if using mongoose types
    eventId?: string; // optional
    name: string;
    price: number;
    currency: string;
    quantity: number;
    sold: number;
    createdAt: string;
    updatedAt: string;
};

export default function Main() {
    const { addToCart } = useCartContext();
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Fetch tickets from API
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await fetch("/api/tickets");
                if (!res.ok) throw new Error("Failed to load");
                const data = await res.json();
                setTickets(data);
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    return (
        <div className="bg-black text-white min-h-dvh">
            <Hero />
            <div className="w-full h-full  px-6 py-12 flex flex-col justify-center items-center">
                {loading && <span className="flex justify-between items-center"><Spinner /><p className="ml-5 text-gray-500">Loading tickets...</p></span>}
                {error && <p className="text-red-500">{error}</p>}
                {!error && !loading && (
                    <div className="w-full">
                        <h1 className="text-2xl font-bold mb-4 text-center">Tickets</h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-5 rounded ">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket._id}
                                    className="glow border bg-gradient-to-tr from-peach-800 via-neutral-dark via-black via-neutral-dark to-peach-800 rounded bg-black p-4 shadow-md flex flex-col justify-between"
                                >
                                    <h2 className="text-lg font-semibold">{ticket.name}</h2>
                                    <p className="">
                                        {ticket.price} {ticket.currency}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        {ticket.quantity - ticket.sold} left
                                    </p>
                                    <button
                                        onClick={() => {
                                            addToCart(ticket.name, ticket.price, ticket.currency, ticket._id, 1)
                                        }}
                                        className="mt-2 cta px-4 py-2 rounded-full"
                                    >
                                        <h3>Add to Cart</h3>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
