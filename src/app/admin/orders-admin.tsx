// components/admin/OrdersAdmin.tsx
"use client";

import React, { useEffect, useState } from "react";
import ConfirmModal from "@/components/confirm-modal";
import { useToast } from "@/components/toast-provider";

type OrderItem = {
    name: string;
    quantity: number;
    // other item fields...
};

type Order = {
    _id: string;
    userEmail?: string;
    totalAmount: number; // assumed already decimal number (not cents) as in your previous code
    currency: string;
    status: string;
    items: OrderItem[];
    createdAt: string;
};

export default function OrdersAdmin() {
    const toast = useToast();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionPending, setActionPending] = useState<string | null>(null); // orderId currently being acted on
    const [confirm, setConfirm] = useState<{ open: boolean; order?: Order | null; action?: string | null }>({
        open: false,
        order: null,
        action: null,
    });

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/orders");
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to fetch orders");
            }
            const data = await res.json();
            setOrders(data.orders ?? []);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("fetchOrders error:", err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openConfirm = (order: Order, action: string) => {
        setConfirm({ open: true, order, action });
    };

    const closeConfirm = () => setConfirm({ open: false, order: null, action: null });

    const performUpdate = async (orderId: string, status: string) => {
        setActionPending(orderId);
        try {
            const res = await fetch("/api/admin/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.error || data?.message || "Failed to update order";
                throw new Error(msg);
            }

            // Update local list (optimistic on server success)
            setOrders((prev) =>
                prev.map((o) => (o._id === orderId ? { ...o, status } : o))
            );

            toast.push({ title: "Updated", message: `Order ${orderId} set to "${status}"`, level: "success" });
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("performUpdate error:", err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setActionPending(null);
            closeConfirm();
        }
    };

    // Confirm modal handler
    const handleConfirm = async () => {
        if (!confirm.order || !confirm.action) return closeConfirm();
        await performUpdate(confirm.order._id, confirm.action);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Orders</h3>
                <div className="flex gap-2">
                    <button onClick={fetchOrders} className="px-3 py-1 bg-blue-600 text-white rounded">Refresh</button>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : orders.length === 0 ? (
                <div className="text-sm text-gray-400">No orders found.</div>
            ) : (
                <div className="space-y-4">
                    {orders.map((o) => (
                        <div key={o._id} className="p-3 border rounded">
                            <div className="flex flex-col md:flex-row md:justify-between">
                                <div>
                                    <div className="font-semibold">Order {o._id}</div>
                                    <div className="text-sm text-gray-600">{o.userEmail}</div>
                                    <div className="text-sm">
                                        {(typeof o.totalAmount === "number" ? o.totalAmount.toFixed(2) : String(o.totalAmount))} {o.currency}
                                    </div>
                                </div>

                                <div className="mt-3 md:mt-0 text-sm text-right">
                                    <div>Status: <strong>{o.status}</strong></div>
                                    <div>{new Date(o.createdAt).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="mt-3">
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => openConfirm(o, "paid")}
                                        className="px-2 py-1 bg-blue-600 text-white rounded"
                                        disabled={actionPending !== null}
                                    >
                                        {actionPending === o._id ? "Processing..." : "Mark paid"}
                                    </button>
                                    <button
                                        onClick={() => openConfirm(o, "fulfilled")}
                                        className="px-2 py-1 bg-green-600 text-white rounded"
                                        disabled={actionPending !== null}
                                    >
                                        {actionPending === o._id ? "Processing..." : "Fulfill"}
                                    </button>
                                    <button
                                        onClick={() => openConfirm(o, "cancelled")}
                                        className="px-2 py-1 bg-gray-300 rounded"
                                        disabled={actionPending !== null}
                                    >
                                        {actionPending === o._id ? "Processing..." : "Cancel"}
                                    </button>
                                </div>

                                <div className="mt-3 text-sm">
                                    {o.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between border-b py-1">
                                            <div>{it.name}</div>
                                            <div>x{it.quantity}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                open={confirm.open}
                title={confirm.action === "paid" ? "Mark order as paid?" : confirm.action === "fulfilled" ? "Mark order fulfilled?" : "Change order status?"}
                description={
                    confirm.order
                        ? `Order ${confirm.order._id} — change status to "${confirm.action}". Are you sure you want to proceed?`
                        : undefined
                }
                confirmLabel={confirm.action === "paid" ? "Mark paid" : confirm.action === "fulfilled" ? "Fulfill" : "Confirm"}
                cancelLabel="Cancel"
                onConfirm={handleConfirm}
                onCancel={closeConfirm}
            />
        </div>
    );
}
