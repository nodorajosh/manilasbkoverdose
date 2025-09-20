// app/admin/discounts-admin.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ToastProvider, useToast } from "@/components/toast-provider";
import ConfirmModal from "@/components/confirm-modal";
import DiscountForm, { Discount } from "./discount-form";

export default function DiscountsAdminShell() {
    return (
        <ToastProvider>
            <DiscountsAdmin />
        </ToastProvider>
    );
}

function DiscountsAdmin() {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"active" | "archived" | "all">("active");
    const [editing, setEditing] = useState<Discount | null>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [confirmState, setConfirmState] = useState<{ open: boolean; action: "archive" | "delete" | null; discount?: Discount | null; }>({ open: false, action: null, discount: null });

    const toast = useToast();

    useEffect(() => {
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/discounts?status=${filter === "all" ? "all" : filter}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setDiscounts(data.discounts ?? []);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setLoading(false);
        }
    };

    const onCreated = (d?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        toast.push({ title: "Created", message: d?.code ?? "New discount", level: "success" });
        setShowCreateModal(false);
        if (d) setDiscounts((prev) => [d, ...prev]);
        else fetchList();
    };

    const onSaved = (d?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        toast.push({ title: "Saved", message: d?.code ?? "", level: "success" });
        if (d) setDiscounts((prev) => prev.map((x) => (x._id === d._id ? d : x)));
        setEditing(null);
    };

    const onArchiveClick = (d: Discount) => setConfirmState({ open: true, action: "archive", discount: d });
    const onDeleteClick = (d: Discount) => setConfirmState({ open: true, action: "delete", discount: d });

    const handleConfirm = async () => {
        const { action, discount } = confirmState;
        if (!discount || !action) return setConfirmState({ open: false, action: null, discount: null });

        try {
            if (action === "archive") {
                const res = await fetch("/api/admin/discounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discountId: discount._id, active: false }) });
                if (!res.ok) throw new Error("Archive failed");
                setDiscounts((prev) => prev.map((x) => (x._id === discount._id ? { ...x, active: false } : x)));
                toast.push({ title: "Archived", message: discount.code, level: "info" });
            } else if (action === "delete") {
                const res = await fetch("/api/admin/discounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discountId: discount._id, hard: true }) });
                if (!res.ok) throw new Error("Delete failed");
                setDiscounts((prev) => prev.filter((x) => x._id !== discount._id));
                toast.push({ title: "Deleted", message: discount.code, level: "info" });
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setConfirmState({ open: false, action: null, discount: null });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button onClick={() => setFilter("active")} className={`px-3 py-1 rounded ${filter === "active" ? "bg-white text-black" : "bg-transparent"}`}>Active</button>
                    <button onClick={() => setFilter("archived")} className={`px-3 py-1 rounded ${filter === "archived" ? "bg-white text-black" : "bg-transparent"}`}>Archived</button>
                    <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded ${filter === "all" ? "bg-white text-black" : "bg-transparent"}`}>All</button>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={fetchList} className="px-3 py-1 bg-blue-600 text-white rounded">Refresh</button>
                    <button onClick={() => setShowCreateModal(true)} className="px-3 py-1 bg-green-600 text-white rounded">Create Discount</button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h3 className="font-semibold mb-2">Discounts</h3>
            </div>

            <div>
                {loading ? (
                    <div>Loading...</div>
                ) : discounts.length === 0 ? (
                    <div className="text-sm text-gray-400">No discounts found.</div>
                ) : (
                    <div className="grid gap-3">
                        {discounts.map((d) => (
                            <div key={d._id} className="p-3 border rounded flex items-center justify-between">
                                <div>
                                    <div className="font-semibold">
                                        {d.code} <span className="text-xs text-gray-400">{d.active ? "active" : "archived"}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {d.type === "fixed" ? `${(d.value / 100).toFixed(2)} ${d.currency}` : `${d.value}%`} • max uses: {d.maxUses ?? "∞"} • expires: {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "never"}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => setEditing(d)} className="px-2 py-1 bg-white/10 rounded">Edit</button>
                                    {d.active ? (
                                        <button onClick={() => onArchiveClick(d)} className="px-2 py-1 bg-yellow-600 rounded text-black">Archive</button>
                                    ) : (
                                        <button onClick={async () => {
                                            try {
                                                const res = await fetch("/api/admin/discounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discountId: d._id, active: true }) });
                                                if (!res.ok) throw new Error("Restore failed");
                                                setDiscounts((prev) => prev.map((x) => (x._id === d._id ? { ...x, active: true } : x)));
                                                toast.push({ title: "Restored", message: d.code, level: "success" });
                                            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                                                toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
                                            }
                                        }} className="px-2 py-1 bg-green-600 rounded text-white">Restore</button>
                                    )}
                                    <button onClick={() => onDeleteClick(d)} className="px-2 py-1 bg-red-600 rounded text-white">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white text-black rounded p-4 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Create Discount</h4>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-600">✕</button>
                        </div>

                        <DiscountForm onSaved={onCreated} onCancel={() => setShowCreateModal(false)} submitLabel="Create discount" />
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
                    <div className="bg-white text-black rounded p-4 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Edit Discount</h4>
                            <button onClick={() => setEditing(null)} className="text-gray-600">✕</button>
                        </div>

                        <DiscountForm initial={editing} onSaved={onSaved} onCancel={() => setEditing(null)} submitLabel="Save changes" />
                    </div>
                </div>
            )}

            {/* Confirm modal */}
            <ConfirmModal
                open={confirmState.open}
                title={confirmState.action === "archive" ? "Archive discount?" : "Delete discount?"}
                description={confirmState.action === "archive"
                    ? `Archive "${confirmState.discount?.code}" — it will be disabled for customers.`
                    : `Delete "${confirmState.discount?.code}" permanently. This cannot be undone.`}
                confirmLabel={confirmState.action === "archive" ? "Archive" : "Delete"}
                cancelLabel="Cancel"
                onConfirm={handleConfirm}
                onCancel={() => setConfirmState({ open: false, action: null, discount: null })}
            />
        </div>
    );
}
