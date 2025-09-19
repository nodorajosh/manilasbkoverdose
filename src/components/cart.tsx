"use client";

import { useCartContext } from "@/contexts/CartContext";

export default function CartSidebar({ onClose }: { onClose: () => void }) {
    const { cart, removeFromCart, clearCart, handleCheckout } = useCartContext();

    return (
        <div className="fixed right-0 top-0 h-dvh w-80 rounded bg-gray-950/50 backdrop-blur-[7.5px] border-[1px] border-gray-50/10 px-6 py-12">
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-xl font-bold">Your Cart</h2>
                <button onClick={onClose} className="text-gray-500">✕</button>
            </div>
            <div className="p-4 space-y-2">
                {cart.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    cart.map((item) => (
                        <div key={item.ticketId} className="flex justify-between items-center">
                            <span>{item.ticketName}</span>
                            <span>x {item.quantity}</span>
                            <button
                                onClick={() => removeFromCart(item.ticketId)}
                                className="text-red-600 hover:text-red-800">
                                &#10006;
                            </button>
                        </div>
                    ))
                )}
            </div>
            {cart.length > 0 && (
                <>
                    <div className="p-4 flex justify-around">
                        <p>Subtotal: &nbsp;</p>
                        <p>{cart[0].ticketCurrency} {cart.reduce((amount, { quantity, ticketPrice }) => quantity * ticketPrice + amount, 0)}</p>
                    </div>
                    <div className="p-4 border-t flex justify-between">
                        <button onClick={clearCart} className="bg-gray-300 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-400">
                            Clear
                        </button>
                        <button
                            className="cta cta-solid text-white px-3 py-1 rounded-full"
                            onClick={() => handleCheckout()}
                        >
                            <h3>
                                Checkout
                            </h3>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
