"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

import { useCart } from "@/hooks/useCart";
import Hero from "./hero";
import Spinner from "@/components/spinner";

export default function Main() {
    const { data: session } = useSession();
    const { addToCart } = useCart(session);
    const [tickets, setTickets] = useState<any[]>([]);
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket._id}
                                    className="border rounded-lg p-4 shadow-md flex flex-col justify-between"
                                >
                                    <h2 className="text-lg font-semibold">{ticket.name}</h2>
                                    <p className="text-gray-700">
                                        {ticket.price} {ticket.currency}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {ticket.quantity - ticket.sold} left
                                    </p>
                                    <button
                                        onClick={() => addToCart(ticket.id)}
                                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Add to Cart
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
