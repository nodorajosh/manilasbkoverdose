"use client";

import { SessionProvider } from "next-auth/react";
// Import other providers as needed

export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {/* Wrap with other providers if necessary */}
            {children}
        </SessionProvider>
    );
}