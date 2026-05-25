"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { trpc } from "@/trpc/react";
import Spinner from "@/components/spinner";

export default function DiscountUsageChart() {
    const { data, isLoading, isError } = trpc.admin.discounts.usageStats.useQuery();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8">
                <Spinner />
                Loading usage chart…
            </div>
        );
    }

    if (isError || !data?.length) {
        return (
            <div className="text-sm text-gray-400 py-4">
                {isError ? "Failed to load discount usage." : "No discount codes yet."}
            </div>
        );
    }

    const chartData = data.map((d) => ({
        code: d.code,
        used: d.used,
        max: d.maxUses ?? null,
        label: d.maxUses != null ? `${d.used} / ${d.maxUses}` : `${d.used}`,
    }));

    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">Discount code usage</h4>
            <div className="h-64 w-full rounded border border-white/10 bg-black/20 p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="code"
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                            angle={-35}
                            textAnchor="end"
                            height={56}
                            interval={0}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                            label={{
                                value: "Times used",
                                angle: -90,
                                position: "insideLeft",
                                fill: "#9ca3af",
                                fontSize: 11,
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#111",
                                border: "1px solid #333",
                                borderRadius: 6,
                            }}
                            formatter={(value: number, _name, props) => {
                                const payload = props.payload as { max: number | null; code: string };
                                const cap =
                                    payload.max != null
                                        ? ` (${value} of ${payload.max} max)`
                                        : "";
                                return [`${value}${cap}`, "Used"];
                            }}
                            labelFormatter={(label) => `Code: ${label}`}
                        />
                        <Bar dataKey="used" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Used" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
