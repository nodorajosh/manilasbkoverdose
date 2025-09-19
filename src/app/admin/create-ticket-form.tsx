// components/admin/CreateTicketForm.tsx
"use client";
import React, { useState } from "react";

type Thumbnail = {
    dataUrl: string;
    size: number;
    mime: string;
    width?: number;
    height?: number;
};

export default function CreateTicketForm() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<number>(10000); // cents
    const [currency, setCurrency] = useState("USD");
    const [quantity, setQuantity] = useState<number>(100);
    const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // Wise fields
    const [wiseEnabled, setWiseEnabled] = useState(false);
    const [wisePaymentLink, setWisePaymentLink] = useState("");
    const [wiseDepositInstructions, setWiseDepositInstructions] = useState("");

    // Validate file: size <= 500KB, aspect ratio close to 9:16
    const handleFile = (file: File | null) => {
        setMsg(null);
        if (!file) return;
        if (!file.type.startsWith("image/")) return setMsg("Please select an image file");
        if (file.size > 500 * 1024) return setMsg("Image must be <= 500 KB");

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = String(reader.result);
            const img = new Image();
            img.onload = () => {
                const w = img.naturalWidth;
                const h = img.naturalHeight;
                const ratio = w / h;
                const target = 9 / 16;
                const tolerance = 0.15; // allow some tolerance for near 9:16
                if (Math.abs(ratio - target) > tolerance) {
                    setMsg("Image must be ~9:16 aspect ratio (portrait).");
                    return;
                }
                setThumbnail({ dataUrl, size: file.size, mime: file.type, width: w, height: h });
            };
            img.onerror = () => setMsg("Invalid image");
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        // quick client-side wise link validation if enabled
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
            const res = await fetch("/api/admin/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    priceCents: price * 100,
                    currency,
                    quantity,
                    thumbnail: thumbnail ? thumbnail : undefined,
                    wise: wiseEnabled
                        ? {
                            enabled: true,
                            paymentLink: wisePaymentLink || null,
                            depositInstructions: wiseDepositInstructions || null,
                        }
                        : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMsg(data?.error?.message || JSON.stringify(data?.error) || "Failed");
            } else {
                setMsg("Ticket created");
                setName("");
                setDescription("");
                setPrice(10000);
                setQuantity(100);
                setThumbnail(null);
                setWiseEnabled(false);
                setWisePaymentLink("");
                setWiseDepositInstructions("");
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMsg(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3 max-w-xl">
            <div>
                <label className="block">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="border p-2 w-full" />
            </div>

            <div>
                <label className="block">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" />
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block">Price</label>
                    <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="border p-2 w-full" />
                </div>
                <div>
                    <label className="block">Currency</label>
                    <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="border p-2 w-24" />
                </div>
                <div>
                    <label className="block">Quantity</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="border p-2 w-24" />
                </div>
            </div>

            <div>
                <label className="block">Thumbnail (9:16 portrait, ≤ 500KB)</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {thumbnail && (
                    <div className="mt-2">
                        <img src={thumbnail.dataUrl} alt="thumb" style={{ width: 120, height: 213, objectFit: "cover" }} />
                        <div className="text-sm">Size: {(thumbnail.size / 1024).toFixed(1)} KB</div>
                    </div>
                )}
            </div>

            {/* Wise payment link section */}
            <div className="border-t pt-3">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={wiseEnabled} onChange={(e) => setWiseEnabled(e.target.checked)} />
                    <span>Enable Wise payment link for this ticket</span>
                </label>

                {wiseEnabled && (
                    <div className="mt-2 space-y-2">
                        <div>
                            <label>Wise payment link (URL)</label>
                            <input
                                value={wisePaymentLink}
                                onChange={(e) => setWisePaymentLink(e.target.value)}
                                placeholder="https://..."
                                className="border p-2 w-full"
                            />
                        </div>

                        <div>
                            <label>Deposit instructions (optional)</label>
                            <textarea
                                value={wiseDepositInstructions}
                                onChange={(e) => setWiseDepositInstructions(e.target.value)}
                                placeholder="Optional instructions (bank name, reference, etc.)"
                                className="border p-2 w-full"
                                rows={4}
                            />
                        </div>
                        <div className="text-xs text-gray-400">
                            If enabled the ticket listing will show a &quot;Pay with Wise&quot; option that links to this URL. Make sure this URL is correct and accessible.
                        </div>
                    </div>
                )}
            </div>

            <div>
                <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
                    {loading ? "Creating..." : "Create Ticket"}
                </button>
            </div>

            {msg && <div className="mt-2 text-sm">{msg}</div>}
        </form>
    );
}
