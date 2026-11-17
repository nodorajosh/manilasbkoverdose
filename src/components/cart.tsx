"use client";

import React, { useEffect } from "react";
import { useCartContext } from "@/contexts/CartContext";
import PayWithPayPalButton from "./pay-with-paypal-button";

export default function CartSidebar({ onClose }: { onClose: () => void }) {
    const { cart, removeFromCart, clearCart, updateQuantity } = useCartContext();
    const subtotal = cart.reduce((sum, item) => sum + (item.discountedPrice ?? item.ticketPrice) * item.quantity, 0);
    const currency = cart[0]?.ticketCurrency ?? "USD";

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex min-h-screen justify-end" role="presentation">
            <button type="button" className="absolute inset-0 bg-black/75" onClick={onClose} aria-label="Close cart" />
            <aside className="relative flex h-dvh min-h-screen w-full max-w-md flex-col border-l border-gold bg-ink p-5 text-white sm:p-7" role="dialog" aria-modal="true" aria-labelledby="cart-title">
                <header className="flex items-start justify-between border-b border-white/30 pb-5">
                    <div>
                        <p className="eyebrow text-white/70">Your selections</p>
                        <h2 id="cart-title" className="mt-2 font-header text-5xl uppercase text-gold">Cart <span className="text-white/50">({cart.length})</span></h2>
                    </div>
                    <button type="button" onClick={onClose} className="focus-ring grid h-11 w-11 place-items-center border border-white/30 text-xl text-white transition hover:border-gold hover:text-gold" aria-label="Close cart">×</button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto py-6">
                    {cart.length === 0 ? (
                        <div className="flex min-h-[55vh] flex-col justify-center">
                            <h3 className="font-header text-5xl uppercase leading-[.9] text-white">Nothing<br />here yet.</h3>
                            <p className="mt-5 max-w-xs text-base leading-7 text-white/65">Choose your pass, then come back here to check out.</p>
                            <button type="button" onClick={onClose} className="cta cta-solid mt-7 w-fit px-5 py-4 text-sm">Browse tickets</button>
                        </div>
                    ) : (
                        <div>
                            {cart.map((item) => {
                                const unitPrice = item.discountedPrice ?? item.ticketPrice;
                                return (
                                    <article key={item.ticketId} className="border-b border-white/25 py-5 first:pt-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-header text-2xl uppercase leading-tight text-white">{item.ticketName}</h3>
                                                <p className="mt-2 text-xs uppercase tracking-[.1em] text-white/60">{item.ticketCurrency} {unitPrice.toFixed(2)} each</p>
                                                {item.discountCode && <p className="mt-2 text-xs text-gold">{item.discountCode} applied</p>}
                                            </div>
                                            <button type="button" onClick={() => void removeFromCart(item.ticketId)} className="focus-ring shrink-0 text-sm text-white/60 underline transition hover:text-garnet" aria-label={`Remove ${item.ticketName}`}>Remove</button>
                                        </div>
                                        <div className="mt-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2" aria-label={`Quantity for ${item.ticketName}`}>
                                                <button type="button" onClick={() => void updateQuantity(item.ticketId, item.quantity - 1)} className="quantity-button" aria-label={`Decrease ${item.ticketName}`}>−</button>
                                                <input type="number" min="0" value={item.quantity} onChange={(event) => void updateQuantity(item.ticketId, Number(event.target.value))} className="h-10 w-10 bg-transparent text-center text-base font-semibold text-white outline-none" aria-label={`Quantity for ${item.ticketName}`} />
                                                <button type="button" onClick={() => void updateQuantity(item.ticketId, item.quantity + 1)} className="quantity-button" aria-label={`Increase ${item.ticketName}`}>+</button>
                                            </div>
                                            <p className="font-header text-xl text-gold">{item.ticketCurrency} {(unitPrice * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <footer className="border-t border-white/30 pt-5">
                        <div className="flex items-center justify-between text-sm text-white/65"><span>Tickets</span><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
                        <div className="mt-3 flex items-end justify-between"><span className="text-white/70">Subtotal</span><strong className="font-header text-3xl font-normal text-gold">{currency} {subtotal.toFixed(2)}</strong></div>
                        <PayWithPayPalButton useCart className="mt-5 w-full" />
                        <button type="button" onClick={() => void clearCart()} className="focus-ring mt-3 w-full py-2 text-sm text-white/60 underline transition hover:text-gold">Clear cart</button>
                    </footer>
                )}
            </aside>
        </div>
    );
}
