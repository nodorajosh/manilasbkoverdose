// components/user/OrdersList.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { trpc } from "@/trpc/react";
import { useToast } from "@/components/toast-provider";
import ConfirmModal from "@/components/confirm-modal";
import Spinner from "@/components/spinner";

type OrderItem = { name: string; quantity: number; price?: number };
type Order = {
    _id: string;
    status: string;
    totalAmount: number;
    currency: string;
    items: OrderItem[];
    createdAt: string | null;
};

export default function OrdersList() {
    const { id } = useParams();
    const email = typeof id === "string" ? id : undefined;

    const toast = useToast();

    // ------ Data fetching via tRPC ------
    const userOrdersQuery = trpc.user.orders.list.useQuery(undefined, {
        enabled: !email,
    });
    const adminOrdersQuery = trpc.user.orders.listByUserEmail.useQuery(
        { email: email! },
        { enabled: !!email },
    );

    const cancelMutation = trpc.user.orders.cancel.useMutation({
        onSuccess: (data) => {
            // update the local list optimistically
            const updated = data.order;
            if (updated) {
                if (email) {
                    adminOrdersQuery.refetch();
                } else {
                    userOrdersQuery.refetch();
                }
                toast.push({
                    title: "Updated",
                    message: `Order ${updated._id} set to "${updated.status}"`,
                    level: "success",
                });
            }
        },
        onError: (err) => {
            toast.push({
                title: "Error",
                message: err.message ?? "Failed to cancel order",
                level: "error",
            });
        },
    });

    const loading = email ? adminOrdersQuery.isLoading : userOrdersQuery.isLoading;
    const orders: Order[] = email
        ? (adminOrdersQuery.data?.orders ?? [])
        : (userOrdersQuery.data?.orders ?? []);

    // confirmation modal state
    const [confirm, setConfirm] = useState<{ open: boolean; order?: Order | null; action?: string | null }>({
        open: false,
        order: null,
        action: null,
    });

    // id of order currently being acted on
    const [actionPending, setActionPending] = useState<string | null>(null);

    const openCancelConfirm = (order: Order) => {
        setConfirm({ open: true, order, action: "cancelled" });
    };

    const closeConfirm = () => setConfirm({ open: false, order: null, action: null });

    const handleConfirm = async () => {
        if (!confirm.order || !confirm.action) return closeConfirm();
        const orderId = confirm.order._id;
        setActionPending(orderId);
        try {
            await cancelMutation.mutateAsync({ orderId });
        } finally {
            setActionPending(null);
            closeConfirm();
        }
    };

    return (
        <>
            {loading && (
                <span className="flex items-center gap-3">
                    <Spinner />
                    <p className="ml-2 text-gray-400">Loading orders...</p>
                </span>
            )}
            {!loading && orders.length === 0 && <div className="text-sm text-gray-400">No orders yet.</div>}
            {!loading && orders.length > 0 && (
                <>
                    <div className="space-y-4">
                        {orders.map((o) => (

                            <div key={o._id} className="p-3 border rounded bg-white/5">
                                <div>
                                    <Link
                                        href={`/orders/${o._id}`}
                                        className="flex flex-col md:flex-row md:justify-between"
                                    >
                                        <div>
                                            <div className="font-semibold">Order {o._id}</div>
                                            <div className="text-sm text-gray-400">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</div>

                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm">Status: <strong>{o.status}</strong></div>
                                            <div className="text-sm">${(o.totalAmount).toFixed(2)} {o.currency}</div>
                                        </div>
                                    </Link>
                                </div>

                                <div className="mt-2 text-sm">
                                    {o.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between border-b py-1">
                                            <div>{it.name}</div>
                                            <div>x{it.quantity}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 flex gap-2">
                                    {o.status === "pending" ? (
                                        <button
                                            onClick={() => openCancelConfirm(o)}
                                            className="px-3 py-1 bg-red-600 text-white rounded"
                                            disabled={actionPending !== null}
                                            aria-disabled={actionPending !== null}
                                            title="Cancel this order"
                                        >
                                            {actionPending === o._id ? "Cancelling..." : "Cancel order"}
                                        </button>
                                    ) : (
                                        <button className="px-3 py-1 bg-gray-700 text-white rounded opacity-60 cursor-not-allowed" disabled>
                                            Cancel not available
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <ConfirmModal
                        open={confirm.open}
                        title={confirm.action === "cancelled" ? "Cancel this order?" : "Confirm"}
                        description={
                            confirm.order
                                ? `Order ${confirm.order._id} — are you sure you want to ${confirm.action === "cancelled" ? "cancel" : "change this order"}?`
                                : undefined
                        }
                        confirmLabel={confirm.action === "cancelled" ? "Yes, cancel order" : "Confirm"}
                        cancelLabel="Keep order"
                        onConfirm={handleConfirm}
                        onCancel={closeConfirm}
                    />
                </>
            )}
        </>
    );
}
