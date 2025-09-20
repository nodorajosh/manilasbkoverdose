"use client";

import React from "react";

export default function ConfirmModal({
    open,
    title = "Confirm",
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
            <div className="bg-white text-black rounded p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
                    </div>
                    <button onClick={onCancel} className="text-gray-500">✕</button>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onCancel} className="px-3 py-1 bg-gray-200 rounded">{cancelLabel}</button>
                    <button onClick={onConfirm} className="px-3 py-1 bg-red-600 text-white rounded">{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}
