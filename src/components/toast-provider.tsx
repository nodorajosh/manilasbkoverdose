// components/ui/ToastProvider.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type ToastLevel = "info" | "success" | "error" | "warning";

type Toast = {
    id: string;
    title?: string;
    message: string;
    level?: ToastLevel;
    duration?: number; // ms
};

type ToastContextValue = {
    push: (toast: Omit<Toast, "id">) => string;
    dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [mounted, setMounted] = useState(false);

    // Mark mounted on client to avoid portal / document usage during SSR
    useEffect(() => {
        setMounted(true);
    }, []);

    const push = useCallback((t: Omit<Toast, "id">) => {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const toast: Toast = { id, ...t };
        setToasts((s) => [toast, ...s]);
        return id;
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((s) => s.filter((t) => t.id !== id));
    }, []);

    // auto-dismiss timers
    useEffect(() => {
        if (toasts.length === 0) return;
        const timers: number[] = [];
        toasts.forEach((t) => {
            const timeout = t.duration ?? 4500;
            const handler = window.setTimeout(() => {
                setToasts((s) => s.filter((x) => x.id !== t.id));
            }, timeout);
            timers.push(handler);
        });
        return () => {
            timers.forEach((id) => clearTimeout(id));
        };
    }, [toasts]);

    const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Render portal only on client after mount to avoid SSR mismatch */}
            {mounted && typeof document !== "undefined"
                ? createPortal(<ToastsView toasts={toasts} onDismiss={dismiss} />, document.body)
                : null}
        </ToastContext.Provider>
    );
}

function ToastsView({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    return (
        <div className="fixed right-4 top-6 z-50 flex flex-col gap-2 items-end max-w-sm">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`w-80 p-3 rounded shadow-md border ${t.level === "success"
                            ? "bg-green-50 border-green-200 text-green-900"
                            : t.level === "error"
                                ? "bg-red-50 border-red-200 text-red-900"
                                : t.level === "warning"
                                    ? "bg-yellow-50 border-yellow-200 text-yellow-900"
                                    : "bg-white border-gray-200 text-gray-900"
                        }`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            {t.title && <div className="font-semibold text-sm">{t.title}</div>}
                            <div className="text-sm">{t.message}</div>
                        </div>
                        <button aria-label="Dismiss" onClick={() => onDismiss(t.id)} className="text-xs opacity-70 ml-2">
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}
