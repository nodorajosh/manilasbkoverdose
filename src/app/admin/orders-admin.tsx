// components/admin/OrdersAdmin.tsx
"use client";
import React, { useEffect, useState } from "react";

type Order = {
    _id: string;
    userEmail?: string;
    totalAmount: number;
    currency: string;
    status: string;
    items: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    createdAt: string;
};

export default function OrdersAdmin() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<string | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        const res = await fetch("/api/admin/orders");
        const data = await res.json();
        setOrders(data.orders ?? []);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (orderId: string, status: string) => {
        setMsg(null);
        const res = await fetch("/api/admin/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, status }),
        });
        const data = await res.json();
        if (!res.ok) setMsg(data?.error || "Failed");
        else {
            setMsg("Updated");
            fetchOrders();
        }
    };

    return (
        <div>
            {msg && <div className="mb-2 text-sm">{msg}</div>}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="space-y-4">
                    {orders.map((o) => (
                        <div key={o._id} className="p-3 border rounded">
                            <div className="flex justify-between">
                                <div>
                                    <div className="font-semibold">Order {o._id}</div>
                                    <div className="text-sm text-gray-600">{o.userEmail}</div>
                                    <div className="text-sm">{(o.totalAmount).toFixed(2)} {o.currency}</div>
                                </div>
                                <div>
                                    <div className="text-sm">Status: <strong>{o.status}</strong></div>
                                    <div className="text-sm">{new Date(o.createdAt).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="mt-2">
                                <div className="flex gap-2">
                                    <button onClick={() => updateStatus(o._id, "paid")} className="px-2 py-1 bg-blue-600 text-white rounded">Mark paid</button>
                                    <button onClick={() => updateStatus(o._id, "fulfilled")} className="px-2 py-1 bg-green-600 text-white rounded">Fulfill</button>
                                    <button onClick={() => updateStatus(o._id, "cancelled")} className="px-2 py-1 bg-gray-300 rounded">Cancel</button>
                                </div>

                                <div className="mt-2 text-sm">
                                    {o.items.map((it: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                        <div key={idx} className="flex justify-between">
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
        </div>
    );
}
