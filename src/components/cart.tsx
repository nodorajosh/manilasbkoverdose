"use client";

import React from "react";
import { useCartContext } from "@/contexts/CartContext";
import PayWithPayPalButton from "./pay-with-paypal-button";

export default function CartSidebar({ onClose }: { onClose: () => void }) {
    const { cart, removeFromCart, clearCart } = useCartContext();

    const subtotal = cart.reduce((acc, it) => acc + it.ticketPrice * it.quantity, 0);
    const currency = cart[0]?.ticketCurrency ?? "USD";

    // const handleDecrement = useCallback(
    //     (ticketId: string, current: number) => {
    //         const next = Math.max(0, current - 1);
    //         updateQuantity(ticketId, next);
    //     },
    //     [updateQuantity]
    // );

    // const handleIncrement = useCallback(
    //     (ticketId: string, current: number) => {
    //         const next = Math.max(1, current + 1);
    //         updateQuantity(ticketId, next);
    //     },
    //     [updateQuantity]
    // );

    return (
        <div className="fixed right-0 top-0 h-dvh w-80 rounded bg-gray-950/50 backdrop-blur-[7.5px] border-[1px] border-gray-50/10 px-6 py-12">
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-xl font-bold">Your Cart</h2>
                <button onClick={onClose} className="text-gray-500">
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-3 overflow-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
                {cart.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    cart.map((item) => (
                        <div key={item.ticketId} className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="font-medium">{item.ticketName}</div>
                                <div className="text-xs text-gray-400">
                                    {item.ticketCurrency} {(item.ticketPrice).toFixed(2)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span>
                                    {item.quantity}
                                </span>
                                {/* <button
                                    onClick={() => handleDecrement(item.ticketId, item.quantity)}
                                    className="px-2 py-1 bg-white/10 rounded"
                                    aria-label={`Decrease ${item.ticketName}`}
                                >
                                    −
                                </button>

                                <input
                                    type="number"
                                    min={0}
                                    value={item.quantity}
                                    onChange={(e) => {
                                        const v = Number(e.target.value || 0);
                                        const sanitized = Number.isNaN(v) ? 0 : Math.max(0, Math.floor(v));
                                        updateQuantity(item.ticketId, sanitized);
                                    }}
                                    className="w-14 text-center bg-transparent border rounded px-1 py-1"
                                    aria-label={`Quantity for ${item.ticketName}`}
                                />

                                <button
                                    onClick={() => handleIncrement(item.ticketId, item.quantity)}
                                    className="px-2 py-1 bg-white/10 rounded"
                                    aria-label={`Increase ${item.ticketName}`}
                                >
                                    +
                                </button> */}

                                <button
                                    onClick={() => removeFromCart(item.ticketId)}
                                    className="text-red-600 hover:text-red-800 ml-2 px-2 py-1 rounded"
                                    aria-label={`Remove ${item.ticketName}`}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {cart.length > 0 && (
                <>
                    <div className="p-4 flex justify-between items-center border-t">
                        <div className="text-sm">Subtotal:</div>
                        <div className="font-semibold">
                            {currency} {subtotal.toFixed(2)}
                        </div>
                    </div>

                    <div className="p-4 border-t flex justify-between">
                        <button onClick={clearCart} className="bg-gray-300 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-400">
                            Clear
                        </button>

                        <div>
                            <PayWithPayPalButton useCart />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
