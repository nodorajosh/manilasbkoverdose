"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./toast-provider";
import { CartProvider } from "@/contexts/CartContext";
import { TRPCProvider } from "@/trpc/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <TRPCProvider>
                <ToastProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </ToastProvider>
            </TRPCProvider>
        </SessionProvider>
    );
}
