// components/admin/DiscountForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";

export type Discount = {
    _id?: string;
    code: string;
    type: "fixed" | "percent";
    value: number; // cents if fixed, percent integer if percent
    currency?: string;
    maxUses?: number | null;
    used?: number;
    expiresAt?: string | null; // ISO
    active?: boolean;
    appliesTo?: string[]; // ticket IDs
    metadata?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export default function DiscountForm({
    initial,
    onSaved,
    onCancel,
    submitLabel,
}: {
    initial?: Discount | null;
    onSaved?: (discount: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    onCancel?: () => void;
    submitLabel?: string;
}) {
    const toast = useToast();

    const [code, setCode] = useState(initial?.code ?? "");
    const [type, setType] = useState<"fixed" | "percent">(initial?.type ?? "fixed");
    const [value, setValue] = useState<number>(initial?.value ?? 0);
    const [currency, setCurrency] = useState(initial?.currency ?? "USD");
    const [maxUses, setMaxUses] = useState<number | "">(() => (initial?.maxUses ?? null) ?? "");
    const [expiresAt, setExpiresAt] = useState<string | "">(initial?.expiresAt ? initial.expiresAt.substring(0, 10) : "");
    const [active, setActive] = useState<boolean>(initial?.active ?? true);
    const [appliesToRaw, setAppliesToRaw] = useState<string>((initial?.appliesTo ?? []).join(","));
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        setCode(initial?.code ?? "");
        setType(initial?.type ?? "fixed");
        setValue(initial?.value ?? 0);
        setCurrency(initial?.currency ?? "USD");
        setMaxUses((initial?.maxUses ?? null) ?? "");
        setExpiresAt(initial?.expiresAt ? initial.expiresAt.substring(0, 10) : "");
        setActive(initial?.active ?? true);
        setAppliesToRaw((initial?.appliesTo ?? []).join(","));
        setMsg(null);
    }, [initial]);

    const submit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setMsg(null);

        const trimmedCode = (code ?? "").trim();
        if (!trimmedCode) {
            setMsg("Code is required.");
            return;
        }
        if (type === "percent" && (value <= 0 || value > 100)) {
            setMsg("Percent value must be between 1 and 100.");
            return;
        }
        if (type === "fixed" && value <= 0) {
            setMsg("Fixed discount value must be > 0 (in cents).");
            return;
        }

        setLoading(true);
        try {
            const payload: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
                code: trimmedCode,
                type,
                value: Math.round(value),
                currency,
                maxUses: maxUses === "" ? null : Number(maxUses),
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
                active,
                appliesTo: appliesToRaw
                    ? appliesToRaw
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : [],
            };

            let res: Response;
            if (initial?._id) {
                payload.discountId = initial._id;
                res = await fetch("/api/admin/discounts", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/admin/discounts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json();
            if (!res.ok) {
                const err = data?.error?.message || JSON.stringify(data?.error) || "Failed";
                setMsg(err);
                toast.push({ title: initial?._id ? "Update failed" : "Create failed", message: err, level: "error" });
            } else {
                const saved = data.discount ?? data;
                toast.push({ title: initial?._id ? "Discount updated" : "Discount created", message: saved.code, level: "success" });
                if (typeof onSaved === "function") onSaved(saved);
                if (!initial?._id) {
                    setCode("");
                    setType("fixed");
                    setValue(0);
                    setCurrency("USD");
                    setMaxUses("");
                    setExpiresAt("");
                    setActive(true);
                    setAppliesToRaw("");
                }
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("DiscountForm submit", err);
            setMsg(String(err?.message ?? err));
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div>
                <label className="block text-sm">Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} required className="border p-2 w-full" />
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value as any)} className="border p-2 w-full"> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                        <option value="fixed">Fixed amount (cents)</option>
                        <option value="percent">Percentage (%)</option>
                    </select>
                </div>

                <div className="w-40">
                    <label className="block text-sm">{type === "fixed" ? "Value (cents)" : "Value (%)"}</label>
                    <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="border p-2 w-full" />
                </div>

                {type === "fixed" && (
                    <div className="w-28">
                        <label className="block text-sm">Currency</label>
                        <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="border p-2 w-full" />
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <div className="w-48">
                    <label className="block text-sm">Max uses (optional)</label>
                    <input type="number" value={maxUses as any} onChange={(e) => setMaxUses(e.target.value === "" ? "" : Number(e.target.value))} className="border p-2 w-full" /> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </div>

                <div className="w-48">
                    <label className="block text-sm">Expires at (optional)</label>
                    <input type="date" value={expiresAt as any} onChange={(e) => setExpiresAt(e.target.value)} className="border p-2 w-full" /> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </div>

                <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                        Active
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm">Applies to ticket IDs (comma-separated)</label>
                <input value={appliesToRaw} onChange={(e) => setAppliesToRaw(e.target.value)} className="border p-2 w-full" placeholder="ticketId1, ticketId2" />
                <div className="text-xs text-gray-500 mt-1">Leave empty for site-wide discount.</div>
            </div>

            <div className="flex gap-2 justify-end">
                {onCancel && <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>}
                <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? "Saving..." : submitLabel ?? (initial ? "Save changes" : "Create discount")}</button>
            </div>

            {msg && <div className="text-sm text-red-600 mt-2">{msg}</div>}
        </form>
    );
}
