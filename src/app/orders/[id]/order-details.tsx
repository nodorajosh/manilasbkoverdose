// components/orders/OrderDetails.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/toast-provider";
import ConfirmModal from "@/components/confirm-modal";
import Spinner from "@/components/spinner";

type OrderItem = {
    ticketId?: any; //eslint-disable-line @typescript-eslint/no-explicit-any
    name: string;
    quantity: number;
    price?: number;
};

type Order = {
    _id: string;
    status: string;
    totalAmount?: number;
    currency?: string;
    items: OrderItem[];
    createdAt?: string;
    updatedAt?: string;
    customer?: {
        name?: string;
        email?: string;
    } | null;
    // other fields allowed
    [k: string]: any; //eslint-disable-line @typescript-eslint/no-explicit-any
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
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionPending, setActionPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // confirm modal state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ action: string; label?: string } | null>(null);

    const isAdmin = role === "admin";

    const fetchOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            // Admins fetch all admin orders and pick the one; users fetch only their orders
            const url = `/api/user/orders/${orderId}`;
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
        const belongsToUser = order.customer?.email ? order.customer.email === currentEmail : false;
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
                body: JSON.stringify({ orderId, status }),
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
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    }

    async function patchUserCancel() {
        setActionPending(true);
        try {
            const res = await fetch("/api/user/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: "cancelled" }),
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
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    }

    const onRequestAction = (action: string) => {
        setConfirmAction({ action, label: action === "cancelled" ? "Cancel order" : `Set status: ${action}` });
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (!confirmAction) return setConfirmOpen(false);
        const act = confirmAction.action;
        if (isAdmin) {
            // admin allowed to set any status
            if (!ADMIN_STATUSES.includes(act as AdminStatus)) {
                toast.push({ title: "Invalid", message: "Invalid status", level: "error" });
                setConfirmOpen(false);
                return;
            }
            await patchAdminStatus(act as AdminStatus);
        } else {
            // non-admin can only cancel
            if (act !== "cancelled") {
                toast.push({ title: "Unauthorized", message: "You can only cancel orders", level: "error" });
                setConfirmOpen(false);
                return;
            }
            await patchUserCancel();
        }
    };

    if (loading) return <div>Loading order…</div>;
    if (error) return <div className="text-red-400">{error}</div>;
    if (!order) return <div className="text-sm text-gray-400">Order not found.</div>;

    return (
        <>
            {loading && (
                <span className="flex items-center gap-3">
                    <Spinner />
                    <p className="ml-2 text-gray-400">Loading orders...</p>
                </span>
            )}
            {!loading && error && (
                <div className="text-red-400">Error: {error}</div>
            )}
            {!loading && !error && order && (
                <div className="max-w-4xl mx-auto bg-white/5 p-6 rounded shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-lg font-semibold">Order {order._id}</div>
                            <div className="text-sm text-gray-400">{new Date(order.createdAt ?? "").toLocaleString()}</div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm">Status: <strong>{order.status}</strong></div>
                            <div className="text-sm">{order.userId ?? ""}</div>
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
                                    <button
                                        onClick={() => fetchOrder()}
                                        className="px-3 py-1 bg-gray-700 text-white rounded"
                                        disabled={actionPending}
                                    >
                                        Refresh
                                    </button>
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
                                    <button onClick={() => fetchOrder()} className="px-3 py-1 bg-gray-700 text-white rounded" disabled={actionPending}>
                                        Refresh
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* audit / meta */}
                    <div className="mt-4 text-xs text-gray-400">
                        <div>Order ID: {order._id}</div>
                        <div>Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</div>
                        <div>Updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "-"}</div>
                    </div>

                    {/* Confirm modal */}
                    <ConfirmModal
                        open={confirmOpen}
                        title={confirmAction?.label ?? "Confirm"}
                        description={`Are you sure you want to ${confirmAction?.action === "cancelled" ? "cancel" : `set status to ${confirmAction?.action}`} for order ${order._id}?`}
                        confirmLabel={confirmAction?.action === "cancelled" ? "Yes, cancel" : "Confirm"}
                        cancelLabel="No, keep"
                        onConfirm={handleConfirm}
                        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
                    />
                </div>
            )}
            {!loading && !error && !order && (
                <div className="text-sm text-gray-400">Order not found.</div>
            )}
        </>
    );
}
