"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./toast-provider";
import { CartProvider } from "@/contexts/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ToastProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </ToastProvider>
        </SessionProvider>
    );
}
