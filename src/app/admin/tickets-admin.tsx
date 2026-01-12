// app/admin/tickets-admin.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";
import ConfirmModal from "@/components/confirm-modal";
import TicketForm, { Ticket } from "./ticket-form";
import Spinner from "@/components/spinner";

export default function TicketsAdmin() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"active" | "archived" | "all">("active");
    const [editing, setEditing] = useState<Ticket | null>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [confirmState, setConfirmState] = useState<{ open: boolean; action: "archive" | "delete" | null; ticket?: Ticket | null; }>(
        { open: false, action: null, ticket: null }
    );

    const toast = useToast();

    useEffect(() => {
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/tickets?status=${filter === "all" ? "all" : filter}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setTickets(data.tickets ?? []);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setLoading(false);
        }
    };

    const onCreated = (ticket?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        toast.push({ title: "Created", message: `Ticket "${ticket?.name ?? "New"}" created`, level: "success" });
        setShowCreateModal(false);
        if (ticket) setTickets((prev) => [ticket, ...prev]);
        else fetchList();
    };

    const onSaved = (ticket?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        toast.push({ title: "Saved", message: `Ticket "${ticket?.name ?? ""}" updated`, level: "success" });
        // optimistic update
        if (ticket) setTickets((prev) => prev.map((t) => (t._id === ticket._id ? ticket : t)));
        setEditing(null);
    };

    const onArchiveClick = (ticket: Ticket) => {
        setConfirmState({ open: true, action: "archive", ticket });
    };

    const onDeleteClick = (ticket: Ticket) => {
        setConfirmState({ open: true, action: "delete", ticket });
    };

    const handleConfirm = async () => {
        const { action, ticket } = confirmState;
        if (!ticket || !action) return setConfirmState({ open: false, action: null, ticket: null });

        try {
            if (action === "archive") {
                const res = await fetch("/api/admin/tickets", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticketId: ticket._id, status: "archived" }),
                });
                if (!res.ok) throw new Error("Archive failed");
                setTickets((prev) => prev.map((t) => (t._id === ticket._id ? { ...t, status: "archived" } : t)));
                toast.push({ title: "Archived", message: `Ticket "${ticket.name}" archived`, level: "info" });
            } else if (action === "delete") {
                const res = await fetch("/api/admin/tickets", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticketId: ticket._id, hard: true }),
                });
                if (!res.ok) throw new Error("Delete failed");
                setTickets((prev) => prev.filter((t) => t._id !== ticket._id));
                toast.push({ title: "Deleted", message: `Ticket "${ticket.name}" deleted`, level: "info" });
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setConfirmState({ open: false, action: null, ticket: null });
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
                    <button onClick={() => setShowCreateModal(true)} className="px-3 py-1 bg-green-600 text-white rounded">Create Ticket</button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h3 className="font-semibold mb-2">Tickets</h3>
            </div>

            <div>
                {loading ? (
                    <span className="flex items-center gap-3">
                        <Spinner />
                        <p className="ml-2 text-gray-400">Loading tickets...</p>
                    </span>
                ) : tickets.length === 0 ? (
                    <div className="text-sm text-gray-400">No tickets found.</div>
                ) : (
                    <div className="grid gap-3">
                        {tickets.map((t) => (
                            <div key={t._id} className="p-3 border rounded flex items-center justify-between">
                                <div>
                                    <div className="font-semibold">
                                        {t.name} <span className="text-xs text-gray-400">({t.status})</span>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        ID: {t._id}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {(t.price).toFixed(2)} {t.currency} • {Math.max(0, t.quantity - (t.sold ?? 0))} left
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => setEditing(t)} className="px-2 py-1 bg-white/10 rounded">Edit</button>

                                    {t.status !== "archived" ? (
                                        <button onClick={() => onArchiveClick(t)} className="px-2 py-1 bg-yellow-600 rounded text-black">Archive</button>
                                    ) : (
                                        <button onClick={async () => {
                                            // quick restore
                                            try {
                                                const res = await fetch("/api/admin/tickets", {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ ticketId: t._id, status: "active" }),
                                                });
                                                if (!res.ok) throw new Error("Restore failed");
                                                setTickets((prev) => prev.map((x) => (x._id === t._id ? { ...x, status: "active" } : x)));
                                                toast.push({ title: "Restored", message: `Ticket "${t.name}" restored`, level: "success" });
                                            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                                                toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
                                            }
                                        }} className="px-2 py-1 bg-green-600 rounded text-white">Restore</button>
                                    )}

                                    <button onClick={() => onDeleteClick(t)} className="px-2 py-1 bg-red-600 rounded text-white">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white text-black rounded p-4 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Create Ticket</h4>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-600">✕</button>
                        </div>

                        <TicketForm onSaved={onCreated} onCancel={() => setShowCreateModal(false)} submitLabel="Create ticket" />
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div
                        className="bg-white text-black rounded p-4 w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Edit Ticket</h4>
                            <button onClick={() => setEditing(null)} className="text-gray-600">✕</button>
                        </div>

                        <TicketForm initial={editing} onSaved={onSaved} onCancel={() => setEditing(null)} submitLabel="Save changes" />
                    </div>
                </div>
            )}

            {/* Confirm modal */}
            <ConfirmModal
                open={confirmState.open}
                title={confirmState.action === "archive" ? "Archive ticket?" : "Delete ticket?"}
                description={
                    confirmState.action === "archive"
                        ? `Archive "${confirmState.ticket?.name}" — archived tickets are hidden from buyers. You can restore later.`
                        : `Delete "${confirmState.ticket?.name}" permanently. This cannot be undone.`
                }
                confirmLabel={confirmState.action === "archive" ? "Archive" : "Delete"}
                cancelLabel="Cancel"
                onConfirm={handleConfirm}
                onCancel={() => setConfirmState({ open: false, action: null, ticket: null })}
            />
        </div>
    );
}
