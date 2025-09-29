// components/orders/OrderDetails.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/components/toast-provider";
import ConfirmModal from "@/components/confirm-modal";
import Spinner from "@/components/spinner";

type OrderItem = {
    ticketId?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string;
    quantity: number;
    price?: number;
};

type PaymentDetails = {
    method?: string | null;
    paymentLink?: string | null;
    depositInstructions?: string | null;
};

type Order = {
    _id: string;
    status: string;
    totalAmount?: number;
    currency?: string;
    items: OrderItem[];
    createdAt?: string;
    updatedAt?: string;
    customer?: { name?: string; email?: string } | null;
    userId?: string | null;
    userEmail?: string | null;
    paymentDetails?: PaymentDetails | null;
    // other fields allowed
    [k: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

const ADMIN_STATUSES = ["pending", "paid", "cancelled", "refunded", "fulfilled"] as const;
type AdminStatus = typeof ADMIN_STATUSES[number];

export default function OrderDetails({
    orderId,
    role,
    currentEmail,
}: {
    orderId: string;
    role: string;
    currentEmail: string;
}) {
    const toast = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionPending, setActionPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // confirmation modal state
    const [confirm, setConfirm] = useState<{ open: boolean; order?: Order | null; action?: string | null }>({
        open: false,
        order: null,
        action: null,
    });

    // payment UI state
    const [paying, setPaying] = useState(false);
    const [paymentBlocked, setPaymentBlocked] = useState(false);

    const isAdmin = role === "admin";

    const fetchOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            // Admins fetch all admin orders and pick the one; users fetch only their orders
            const url = `/api/user/orders/order/${orderId}`;
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload?.error || "Failed to fetch orders");
            }
            const payload = await res.json();
            const found = payload?.order ?? null;
            if (!found) {
                setOrder(null);
                setError("Order not found or you don't have permission to view it.");
            } else {
                setOrder(found);
            }
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("fetchOrder error:", err);
            setError(String(err?.message ?? err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, role]);

    const canUserCancel = useMemo(() => {
        if (!order) return false;
        if (isAdmin) return true; // admin can do everything
        // For non-admins, allow cancel only if the order belongs to currentEmail and status is pending
        const belongsToUser = order.customer?.email ? order.customer.email === currentEmail : (order.userEmail ?? order.userId) === currentEmail;
        return belongsToUser && order.status === "pending";
    }, [order, isAdmin, currentEmail]);

    const formatMoney = (cents?: number, currency?: string) => {
        const val = Number(cents ?? 0);
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: currency ?? "USD",
                minimumFractionDigits: 2,
            }).format(val);
        } catch {
            return `${(val).toFixed(2)} ${currency ?? ""}`;
        }
    };

    async function patchAdminStatus(status: AdminStatus) {
        setActionPending(true);
        try {
            const res = await fetch("/api/admin/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ _id: orderId, status }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload?.error || "Failed to update order");

            // update UI
            setOrder((o) => (o ? { ...o, status } : o));
            toast.push({ title: "Updated", message: `Order status set to ${status}`, level: "success" });
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("patchAdminStatus error:", err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setActionPending(false);
        }
    }

    async function patchUserCancel() {
        setActionPending(true);
        try {
            const res = await fetch("/api/user/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ _id: orderId, status: "cancelled" }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload?.error || "Failed to cancel order");

            setOrder((o) => (o ? { ...o, status: "cancelled" } : o));
            toast.push({ title: "Cancelled", message: "Your order was cancelled", level: "success" });
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("patchUserCancel error:", err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setActionPending(false);
            setConfirm({ open: false, order: null, action: null });
        }
    }

    const onRequestAction = (action: string) => {
        setConfirm({ open: true, order, action });
    };

    const handleConfirm = async () => {
        if (!confirm.action) return setConfirm({ open: false, order: null, action: null });
        const act = confirm.action;
        if (isAdmin) {
            // admin allowed to set any status
            if (!ADMIN_STATUSES.includes(act as AdminStatus)) {
                toast.push({ title: "Invalid", message: "Invalid status", level: "error" });
                setConfirm({ open: false, order: null, action: null });
                return;
            }
            await patchAdminStatus(act as AdminStatus);
        } else {
            // non-admin can only cancel
            if (act !== "cancelled") {
                toast.push({ title: "Unauthorized", message: "You can only cancel orders", level: "error" });
                setConfirm({ open: false, order: null, action: null });
                return;
            }
            await patchUserCancel();
        }
    };

    // Back button handler:
    const handleBack = () => {
        // Prefer history.back() when there's navigation history
        if (typeof window !== "undefined") {
            if (window.history.length > 1) {
                router.back();
                return;
            }
        }

        // Next try a `from` search param (e.g. ?from=/some/path)
        const from = searchParams?.get?.("from");
        if (from) {
            router.push(from);
            return;
        }

        // Fallback: safe default page
        router.push("/user");
    };

    // Safe open payment link: opens about:blank synchronously then navigates
    const openPaymentLinkSafe = (link?: string | null) => {
        if (!link) {
            toast.push({ title: "No link", message: "No payment link available for this order.", level: "error" });
            return;
        }

        // open blank synchronously to avoid popup blockers
        let win: Window | null = null;
        try {
            win = window.open("about:blank", "_blank");
            if (!win) {
                setPaymentBlocked(true);
                toast.push({ title: "Popup blocked", message: "Popup blocked. Please copy the payment link below.", level: "warning" });
                return;
            }
            try { (win as any).opener = null; } catch { } //eslint-disable-line @typescript-eslint/no-explicit-any
            // navigate
            win.location.href = link;
            setPaymentBlocked(false);
        } catch (err) {
            console.error("openPaymentLinkSafe error:", err);
            setPaymentBlocked(true);
            toast.push({ title: "Payment open failed", message: "Couldn't open payment link automatically. Please copy the link below.", level: "warning" });
            try { win?.close(); } catch { }
        }
    };

    // convenience: copy payment link to clipboard
    const copyPaymentLink = async (link?: string | null) => {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            toast.push({ title: "Copied", message: "Payment link copied to clipboard", level: "success" });
        } catch (err) {
            console.error("copy failed", err);
            toast.push({ title: "Failed", message: "Couldn't copy link — please copy manually", level: "error" });
        }
    };

    // Render
    return (
        <>
            {loading && (
                <span className="w-full flex items-center justify-center">
                    <Spinner />
                    <p className="ml-2 text-gray-400">Loading order...</p>
                </span>
            )}
            {!loading && error && <div className="w-full flex items-center justify-center text-red-400">Error: {error}</div>}
            {!loading && !error && !order && <div className="text-sm text-gray-400">Order not found.</div>}
            {!loading && !error && order && (
                <div className="max-w-4xl mx-auto bg-white/5 p-6 rounded shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                        <div className="flex items-center justify-between md:justify-center gap-3">
                            <button
                                onClick={handleBack}
                                aria-label="Go back"
                                className="p-2 rounded hover:bg-white/5"
                            >
                                {/* simple left arrow */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    <path d="M13 10a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                            </button>

                            <div>
                                <div className="text-lg font-semibold">Order {order._id}</div>
                                <div className="text-sm text-gray-400">{new Date(order.createdAt ?? "").toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm">Status: <strong>{order.status}</strong></div>
                            <div className="text-sm">{order.userEmail ?? order.userId ?? ""}</div>
                        </div>
                    </div>

                    <div className="border-t border-b py-4">
                        <h3 className="font-semibold mb-2">Items</h3>
                        <div className="space-y-2">
                            {order.items?.length ? (
                                order.items.map((it, idx) => {
                                    const ticket = (it.ticketId && typeof it.ticketId === "object") ? it.ticketId : null;
                                    const name = it.name ?? ticket?.name ?? "Ticket";
                                    const price = it.price ?? ticket?.price ?? undefined;
                                    return (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{name}</div>
                                                <div className="text-xs text-gray-400">{ticket?._id ? `Ticket ID: ${ticket._id}` : null}</div>
                                            </div>
                                            <div className="text-right">
                                                <div>{it.quantity} × {formatMoney(price, order.currency)}</div>
                                                <div className="text-sm text-gray-400">{formatMoney((price ?? 0) * (it.quantity ?? 1), order.currency)}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-sm text-gray-400">No items</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <div>
                            <div className="text-sm text-gray-400">Total</div>
                            <div className="text-2xl font-bold">{formatMoney(order.totalAmount ?? order.items?.reduce((s, it) => s + ((it.price ?? 0) * (it.quantity ?? 1)), 0), order.currency)}</div>
                        </div>

                        <div className="flex gap-2">
                            {/* Payment / admin controls */}
                            {order.paymentDetails?.paymentLink && order.status === "pending" && (
                                <>
                                    {/* If user is owner or admin show pay button */}
                                    {isAdmin || ((order.customer?.email ?? order.userEmail ?? order.userId) === currentEmail) ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setPaying(true);
                                                    openPaymentLinkSafe(order.paymentDetails?.paymentLink);
                                                    // small delay to keep button disabled briefly
                                                    setTimeout(() => setPaying(false), 1200);
                                                }}
                                                disabled={paying}
                                                className="px-3 py-1 bg-yellow-500 text-black rounded"
                                                title="Open payment link in new tab"
                                            >
                                                {paying ? "Opening..." : `Open Payment Details (${order.paymentDetails?.method ?? "pay"})`}
                                            </button>

                                            <button onClick={() => copyPaymentLink(order.paymentDetails?.paymentLink)} className="px-3 py-1 bg-gray-700 text-white rounded">
                                                Copy Link
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            )}

                            {isAdmin ? (
                                <>
                                    <select
                                        defaultValue={order.status}
                                        onChange={(e) => onRequestAction(e.target.value)}
                                        className="border px-2 py-1 rounded bg-white text-black"
                                        disabled={actionPending}
                                        aria-label="Change order status"
                                    >
                                        <option value="">Set status...</option>
                                        {ADMIN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <button onClick={() => fetchOrder()} className="px-3 py-1 bg-gray-700 text-white rounded" disabled={actionPending}>Refresh</button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => onRequestAction("cancelled")}
                                        className={`px-3 py-1 rounded ${canUserCancel ? "bg-red-600 text-white" : "bg-gray-700 text-white opacity-60 cursor-not-allowed"}`}
                                        disabled={!canUserCancel || actionPending}
                                        title={canUserCancel ? "Cancel order" : "Can't cancel this order"}
                                    >
                                        {actionPending ? "Processing..." : "Cancel Order"}
                                    </button>
                                    <button onClick={() => fetchOrder()} className="px-3 py-1 bg-gray-700 text-white rounded" disabled={actionPending}>Refresh</button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* payment instructions */}
                    {order.paymentDetails?.depositInstructions ? (
                        <div className="mt-4 bg-white/5 p-4 rounded">
                            <h4 className="font-semibold">Deposit instructions</h4>
                            <div className="text-sm text-gray-200 whitespace-pre-wrap">{order.paymentDetails.depositInstructions}</div>
                        </div>
                    ) : null}

                    {/* helper UI if payment was blocked */}
                    {paymentBlocked && order.paymentDetails?.paymentLink ? (
                        <div className="mt-3 p-3 bg-yellow-50 text-yellow-900 rounded">
                            The payment window may have been blocked by your browser. <button className="underline ml-1" onClick={() => copyPaymentLink(order.paymentDetails?.paymentLink)}>Copy link</button> or open it manually:
                            <div className="mt-2 break-all">
                                <a href={order.paymentDetails.paymentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{order.paymentDetails.paymentLink}</a>
                            </div>
                        </div>
                    ) : null}

                    {/* audit / meta */}
                    <div className="mt-4 text-xs text-gray-400">
                        <div>Order ID: {order._id}</div>
                        <div>Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</div>
                        <div>Updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "-"}</div>
                    </div>

                    {/* Confirm modal */}
                    <ConfirmModal
                        open={confirm.open}
                        title={confirm.action ?? "Confirm"}
                        description={`Are you sure you want to ${confirm.action === "cancelled" ? "cancel" : `set status to ${confirm.action}`} for order ${order._id}?`}
                        confirmLabel={confirm.action === "cancelled" ? "Yes, cancel" : "Confirm"}
                        cancelLabel="No, keep"
                        onConfirm={handleConfirm}
                        onCancel={() => { setConfirm({ open: false, order: null, action: null }); }}
                    />
                </div>
            )}
        </>
    );
}
