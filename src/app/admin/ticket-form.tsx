"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";

import { RichTextEditor } from "@/components/rich-text-editor";

type Thumbnail = {
    dataUrl: string;
    size: number;
    mime: string;
    width?: number;
    height?: number;
};

export type Ticket = {
    _id?: string;
    name: string;
    description?: string;
    price: number; // cents
    currency: string;
    quantity: number;
    sold?: number;
    metadata?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    thumbnail?: Thumbnail | undefined;
    wise?: { enabled: boolean; paymentLink: string | null; depositInstructions?: string | null } | undefined;
    status?: "active" | "archived" | "draft";
    category: "festival pass" | "single pass" | "special workshops" | "other events"
};

export default function TicketForm({
    initial,
    onSaved,
    onCancel,
    submitLabel,
}: {
    initial?: Ticket | null;
    onSaved?: (ticket: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    onCancel?: () => void;
    submitLabel?: string;
}) {
    const toast = useToast();

    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [price, setPrice] = useState<number>(initial?.price ?? 10000); // cents
    const [currency, setCurrency] = useState(initial?.currency ?? "USD");
    const [quantity, setQuantity] = useState<number>(initial?.quantity ?? 100);
    const [thumbnail, setThumbnail] = useState<Thumbnail | undefined>(initial?.thumbnail ?? undefined);
    const [wiseEnabled, setWiseEnabled] = useState<boolean>(initial?.wise?.enabled ?? false);
    const [wisePaymentLink, setWisePaymentLink] = useState<string>(initial?.wise?.paymentLink ?? "");
    const [wiseDepositInstructions, setWiseDepositInstructions] = useState<string>(initial?.wise?.depositInstructions ?? "");
    const [status, setStatus] = useState<Ticket["status"]>(initial?.status ?? "active");
    const [category, setCategory] = useState<Ticket["category"]>(initial?.category ?? "festival pass");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        // when initial prop changes (opening edit modal), copy values
        setName(initial?.name ?? "");
        setDescription(initial?.description ?? "");
        setPrice(initial?.price ?? 10000);
        setCurrency(initial?.currency ?? "USD");
        setQuantity(initial?.quantity ?? 100);
        setThumbnail(initial?.thumbnail ?? undefined);
        setWiseEnabled(initial?.wise?.enabled ?? false);
        setWisePaymentLink(initial?.wise?.paymentLink ?? "");
        setWiseDepositInstructions(initial?.wise?.depositInstructions ?? "");
        setStatus(initial?.status ?? "active");
        setCategory(initial?.category ?? "festival pass");
        setMsg(null);
    }, [initial]);

    const handleFile = (file: File | null) => {
        setMsg(null);
        if (!file) return;
        if (!file.type.startsWith("image/")) return setMsg("Please select an image file");
        if (file.size > 500 * 1024) return setMsg("Image must be ≤ 500 KB");

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = String(reader.result);
            const img = new Image();
            img.onload = () => {
                const w = img.naturalWidth;
                const h = img.naturalHeight;
                const ratio = w / h;
                const target = 16 / 9;
                const tolerance = 0.15;
                if (Math.abs(ratio - target) > tolerance) {
                    setMsg("Image must be ~16:9 aspect ratio (landscape).");
                    return;
                }
                setThumbnail({ dataUrl, size: file.size, mime: file.type, width: w, height: h });
            };
            img.onerror = () => setMsg("Invalid image");
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const submit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setMsg(null);

        if (wiseEnabled && wisePaymentLink) {
            try {
                const u = new URL(wisePaymentLink);
                if (!["https:", "http:"].includes(u.protocol)) {
                    setMsg("Wise payment link must be a valid URL");
                    return;
                }
            } catch {
                setMsg("Invalid Wise payment URL");
                return;
            }
        }

        setLoading(true);
        try {
            const payload: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
                name,
                description,
                price: price * 100, // cents
                currency,
                quantity,
                status,
                category,
                thumbnail: thumbnail ?? undefined,
                wise: wiseEnabled
                    ? {
                        enabled: true,
                        paymentLink: wisePaymentLink,
                        depositInstructions: wiseDepositInstructions || null,
                    }
                    : { enabled: false },
            };

            let res: Response;
            if (initial?._id) {
                // update
                payload.ticketId = initial._id;
                res = await fetch("/api/admin/tickets", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                // create
                res = await fetch("/api/admin/tickets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json();
            if (!res.ok) {
                const err = data?.error?.message || JSON.stringify(data?.error) || "Failed";
                setMsg(err);
                toast.push({ title: initial ? "Update failed" : "Create failed", message: err, level: "error" });
            } else {
                const ticket = data.ticket ?? data;
                toast.push({ title: initial ? "Ticket updated" : "Ticket created", message: `Ticket "${ticket.name ?? name}" saved`, level: "success" });
                if (typeof onSaved === "function") onSaved(ticket);
                // reset if created
                if (!initial?._id) {
                    setName("");
                    setDescription("");
                    setPrice(10000);
                    setQuantity(100);
                    setThumbnail(undefined);
                    setWiseEnabled(false);
                    setWisePaymentLink("");
                    setWiseDepositInstructions("");
                }
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("TicketForm submit error", err);
            setMsg(err?.message ?? "Failed");
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div>
                <label className="block text-sm font-medium">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="border p-2 w-full" />
            </div>

            {/* <div>
                <label className="block text-sm">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" />
            </div> */}
            <div>
                <label className="block text-sm">Description</label>
                <RichTextEditor value={description} onChange={setDescription} />
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm">Price</label>
                    <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="border p-2 w-full" />
                </div>
                <div>
                    <label className="block text-sm">Currency</label>
                    <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="border p-2 w-24" />
                </div>
                <div>
                    <label className="block text-sm">Quantity</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="border p-2 w-24" />
                </div>
            </div>

            <div>
                <label className="block text-sm">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="border p-2 w-full"> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    <option value="festival pass">Festival Pass</option>
                    <option value="single pass">Single Pass</option>
                    <option value="special workshops">Special Workshops</option>
                    <option value="other events">Other Events</option>
                </select>
            </div>

            <div>
                <label className="block text-sm">Thumbnail (16:9, ≤ 500KB)</label>
                <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                {thumbnail && (
                    <div className="mt-2">
                        <img src={thumbnail.dataUrl} alt="thumb" style={{ width: 213, height: 120, objectFit: "cover" }} />
                        <div className="text-sm">Size: {(thumbnail.size / 1024).toFixed(1)} KB</div>
                    </div>
                )}
            </div>

            <div className="border-t pt-3">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={wiseEnabled} onChange={(e) => setWiseEnabled(e.target.checked)} />
                    <span>Enable Wise payment link for this ticket</span>
                </label>

                {wiseEnabled && (
                    <div className="mt-2 space-y-2">
                        <div>
                            <label className="block text-sm">Wise payment link (URL)</label>
                            <input value={wisePaymentLink} onChange={(e) => setWisePaymentLink(e.target.value)} placeholder="https://..." className="border p-2 w-full" />
                        </div>

                        <div>
                            <label className="block text-sm">Deposit instructions (optional)</label>
                            <textarea value={wiseDepositInstructions} onChange={(e) => setWiseDepositInstructions(e.target.value)} className="border p-2 w-full" rows={4} />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-2">
                <label className="block text-sm">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="border p-2 w-full"> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <div className="flex gap-2 justify-end mt-4">
                {onCancel && <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>}
                <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? "Saving..." : submitLabel ?? (initial ? "Save changes" : "Create ticket")}</button>
            </div>

            {msg && <div className="text-sm text-red-600 mt-2">{msg}</div>}
        </form>
    );
}
