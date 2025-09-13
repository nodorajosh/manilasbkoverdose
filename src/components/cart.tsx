"use client";

import { useSession } from "next-auth/react";
import { useCart } from "@/hooks/useCart";

export default function CartSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { data: session } = useSession();
    const { cart, removeFromCart } = useCart(session);

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-dvh w-80 rounded bg-gray-950/50 backdrop-blur-[7.5px] border-[1px] border-gray-50/10 px-6 py-12">
            <button onClick={onClose} className="mb-4 text-gray-300">Close</button>
            <h2 className="text-xl font-bold mb-4">Your Cart</h2>
            {cart.length === 0 ? (
                <p>No items in cart</p>
            ) : (
                <ul className="space-y-3">
                    {cart.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center">
                            <span>{item.ticketId?.name || item.ticketId}</span>
                            <span>x{item.quantity}</span>
                            <button
                                onClick={() => removeFromCart(item.ticketId)}
                                className="text-red-500 hover:underline"
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
