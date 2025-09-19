// components/admin/CreateDiscountForm.tsx
"use client";
import React, { useState } from "react";

export default function CreateDiscountForm() {
    const [code, setCode] = useState("");
    const [type, setType] = useState<"percent" | "fixed">("percent");
    const [value, setValue] = useState<number>(10);
    const [expiresAt, setExpiresAt] = useState<string>("");
    const [msg, setMsg] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        try {
            const res = await fetch("/api/admin/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, type, value, expiresAt: expiresAt || null }),
            });
            const data = await res.json();
            if (!res.ok) setMsg(data?.error?.message || JSON.stringify(data?.error));
            else setMsg("Created discount");
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMsg(err.message || "Error");
        }
    };

    return (
        <form onSubmit={submit} className="max-w-lg space-y-3">
            <div>
                <label>Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} className="border p-2 w-full" />
            </div>

            <div className="flex gap-2">
                <div>
                    <label>Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value as any)} className="border p-2 text-black"> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                        <option value="percent">Percent</option>
                        <option value="fixed">Fixed (cents)</option>
                    </select>
                </div>
                <div>
                    <label>Value</label>
                    <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="border p-2 w-24" />
                </div>
                <div>
                    <label>Expires at</label>
                    <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="border p-2" />
                </div>
            </div>

            <button className="bg-green-600 text-white px-4 py-2 rounded">Create Discount</button>
            {msg && <div className="mt-2 text-sm">{msg}</div>}
        </form>
    );
}
