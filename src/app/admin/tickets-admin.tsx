"use client";

import React, { useMemo, useState } from "react";
import { useToast } from "@/components/toast-provider";
import ConfirmModal from "@/components/confirm-modal";
import TicketForm, { Ticket } from "./ticket-form";
import Spinner from "@/components/spinner";
import { trpc } from "@/trpc/react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { LoadMoreSentinel } from "@/components/admin/load-more-sentinel";

export default function TicketsAdmin() {
    const [filter, setFilter] = useState<"active" | "archived" | "all">("active");
    const [editing, setEditing] = useState<Ticket | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        action: "archive" | "delete" | null;
        ticket?: Ticket | null;
    }>({ open: false, action: null, ticket: null });

    const toast = useToast();
    const utils = trpc.useUtils();

    const listQuery = trpc.admin.tickets.list.useInfiniteQuery(
        { status: filter, limit: 20 },
        { getNextPageParam: (last) => last.nextCursor }
    );

    const tickets = useMemo(
        () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
        [listQuery.data]
    );

    const sentinelRef = useInfiniteScroll({
        hasNextPage: listQuery.hasNextPage,
        isFetchingNextPage: listQuery.isFetchingNextPage,
        fetchNextPage: () => listQuery.fetchNextPage(),
    });

    const invalidate = () => void utils.admin.tickets.list.invalidate();

    const onCreated = (ticket?: Ticket) => {
        toast.push({ title: "Created", message: `Ticket "${ticket?.name ?? "New"}" created`, level: "success" });
        setShowCreateModal(false);
        invalidate();
    };

    const onSaved = (ticket?: Ticket) => {
        toast.push({ title: "Saved", message: `Ticket "${ticket?.name ?? ""}" updated`, level: "success" });
        setEditing(null);
        invalidate();
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
                toast.push({ title: "Archived", message: `Ticket "${ticket.name}" archived`, level: "info" });
            } else if (action === "delete") {
                const res = await fetch("/api/admin/tickets", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticketId: ticket._id, hard: true }),
                });
                if (!res.ok) throw new Error("Delete failed");
                toast.push({ title: "Deleted", message: `Ticket "${ticket.name}" deleted`, level: "info" });
            }
            invalidate();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.push({ title: "Error", message, level: "error" });
        } finally {
            setConfirmState({ open: false, action: null, ticket: null });
        }
    };

    const restore = async (t: Ticket) => {
        try {
            const res = await fetch("/api/admin/tickets", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: t._id, status: "active" }),
            });
            if (!res.ok) throw new Error("Restore failed");
            toast.push({ title: "Restored", message: `Ticket "${t.name}" restored`, level: "success" });
            invalidate();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.push({ title: "Error", message, level: "error" });
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
                    <button onClick={() => listQuery.refetch()} className="px-3 py-1 bg-blue-600 text-white rounded">Refresh</button>
                    <button onClick={() => setShowCreateModal(true)} className="px-3 py-1 bg-green-600 text-white rounded">Create Ticket</button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h3 className="font-semibold mb-2">Tickets</h3>
            </div>

            <div>
                {listQuery.isLoading ? (
                    <span className="flex items-center gap-3">
                        <Spinner />
                        <p className="ml-2 text-gray-400">Loading tickets...</p>
                    </span>
                ) : listQuery.isError ? (
                    <div className="text-sm text-red-400">Failed to load tickets.</div>
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
                                    <div className="text-sm text-gray-400">ID: {t._id}</div>
                                    <div className="text-sm text-gray-600">
                                        {t.price.toFixed(2)} {t.currency} • {Math.max(0, t.quantity - (t.sold ?? 0))} left
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => setEditing(t)} className="px-2 py-1 bg-white/10 rounded">Edit</button>
                                    {t.status !== "archived" ? (
                                        <button onClick={() => onArchiveClick(t)} className="px-2 py-1 bg-yellow-600 rounded text-black">Archive</button>
                                    ) : (
                                        <button onClick={() => restore(t)} className="px-2 py-1 bg-green-600 rounded text-white">Restore</button>
                                    )}
                                    <button onClick={() => onDeleteClick(t)} className="px-2 py-1 bg-red-600 rounded text-white">Delete</button>
                                </div>
                            </div>
                        ))}
                        <LoadMoreSentinel
                            sentinelRef={sentinelRef}
                            isFetchingNextPage={listQuery.isFetchingNextPage}
                            hasNextPage={listQuery.hasNextPage}
                        />
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white text-black rounded p-4 w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Create Ticket</h4>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-600">✕</button>
                        </div>
                        <TicketForm onSaved={onCreated} onCancel={() => setShowCreateModal(false)} submitLabel="Create ticket" />
                    </div>
                </div>
            )}

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
