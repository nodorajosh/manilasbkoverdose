"use client";

import React, { useEffect } from "react";
import { useCartContext } from "@/contexts/CartContext";
import PayWithPayPalButton from "./pay-with-paypal-button";

export default function CartSidebar({ onClose }: { onClose: () => void }) {
    const { cart, removeFromCart, clearCart, updateQuantity } = useCartContext();
    const subtotal = cart.reduce((sum, item) => sum + (item.discountedPrice ?? item.ticketPrice) * item.quantity, 0);
    const currency = cart[0]?.ticketCurrency ?? "USD";

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex min-h-screen justify-end" role="presentation">
            <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close cart" />
            <aside className="relative flex h-dvh min-h-screen w-full max-w-md flex-col border-l border-white/10 bg-[#120d18]/95 p-5 text-white shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="cart-title">
                <header className="flex items-start justify-between border-b border-white/10 pb-5">
                    <div>
                        <p className="eyebrow">Your selections</p>
                        <h2 id="cart-title" className="mt-1 text-3xl font-semibold tracking-tight">Cart <span className="text-white/50">({cart.length})</span></h2>
                    </div>
                    <button type="button" onClick={onClose} className="focus-ring rounded-full border border-white/15 px-3 py-2 text-white/70 transition hover:border-[#e4bf62] hover:text-white" aria-label="Close cart">×</button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto py-5">
                    {cart.length === 0 ? (
                        <div className="grid min-h-[45vh] place-items-center text-center">
                            <div>
                                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#e4bf62]/30 bg-[#e4bf62]/10 text-2xl text-[#f3d78a]">+</div>
                                <h3 className="mt-5 text-xl font-semibold">Your cart is waiting</h3>
                                <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">Choose your pass, then return here when your night is ready.</p>
                                <button type="button" onClick={onClose} className="cta cta-outline mt-6 px-5 py-3">Browse tickets</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => {
                                const unitPrice = item.discountedPrice ?? item.ticketPrice;
                                return (
                                    <article key={item.ticketId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-white">{item.ticketName}</h3>
                                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{item.ticketCurrency} {unitPrice.toFixed(2)} each</p>
                                                {item.discountCode && <p className="mt-2 text-xs text-[#f3d78a]">{item.discountCode} applied</p>}
                                            </div>
                                            <button type="button" onClick={() => void removeFromCart(item.ticketId)} className="focus-ring rounded px-1 text-sm text-white/45 transition hover:text-[#f08b9a]" aria-label={`Remove ${item.ticketName}`}>Remove</button>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between gap-4">
                                            <div className="flex items-center rounded-full border border-white/15 bg-black/20 p-1" aria-label={`Quantity for ${item.ticketName}`}>
                                                <button type="button" onClick={() => void updateQuantity(item.ticketId, item.quantity - 1)} className="focus-ring grid h-8 w-8 place-items-center rounded-full text-lg text-white/70 transition hover:bg-white/10 hover:text-white" aria-label={`Decrease ${item.ticketName}`}>−</button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.quantity}
                                                    onChange={(event) => void updateQuantity(item.ticketId, Number(event.target.value))}
                                                    className="w-12 bg-transparent text-center text-sm font-semibold text-white outline-none"
                                                    aria-label={`Quantity for ${item.ticketName}`}
                                                />
                                                <button type="button" onClick={() => void updateQuantity(item.ticketId, item.quantity + 1)} className="focus-ring grid h-8 w-8 place-items-center rounded-full text-lg text-white/70 transition hover:bg-white/10 hover:text-white" aria-label={`Increase ${item.ticketName}`}>+</button>
                                            </div>
                                            <p className="font-semibold text-[#f3d78a]">{item.ticketCurrency} {(unitPrice * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <footer className="border-t border-white/10 pt-5">
                        <div className="flex items-center justify-between text-sm text-white/60"><span>Tickets</span><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
                        <div className="mt-3 flex items-end justify-between"><span className="text-white/70">Subtotal</span><strong className="text-2xl text-[#f3d78a]">{currency} {subtotal.toFixed(2)}</strong></div>
                        <PayWithPayPalButton useCart className="mt-5 w-full" />
                        <button type="button" onClick={() => void clearCart()} className="focus-ring mt-3 w-full rounded-full py-2 text-sm text-white/45 transition hover:text-white">Clear cart</button>
                    </footer>
                )}
            </aside>
        </div>
    );
}
