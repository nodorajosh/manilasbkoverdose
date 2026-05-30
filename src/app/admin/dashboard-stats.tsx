"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type DailySale = {
    date: string;
    revenue: number;
    orders: number;
};

type StatsData = {
    dailySales: DailySale[];
    totals: {
        revenue: number;
        orders: number;
        avgOrderValue: number;
    };
    statusCounts: Record<string, number>;
};

export default function DashboardStats() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Date range filter
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
    const [dateTo, setDateTo] = useState(today);

    const fetchStats = useCallback(async (from?: string, to?: string) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            const res = await fetch(`/api/admin/stats?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to load stats");
            const data = await res.json();
            setStats(data);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err?.message ?? "Failed to load stats");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats(dateFrom, dateTo);
    }, [fetchStats, dateFrom, dateTo]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStats(dateFrom, dateTo);
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

    if (loading) {
        return (
            <div className="w-full animate-pulse space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-xl bg-gray-800" />
                    ))}
                </div>
                <div className="h-72 rounded-xl bg-gray-800" />
            </div>
        );
    }

    if (error) {
        return <p className="text-red-400 text-center py-8">{error}</p>;
    }

    if (!stats) return null;

    return (
        <div className="w-full space-y-8">
            {/* Date filter */}
            <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">From</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">To</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 cta cta-solid rounded-full text-sm"
                >
                    Apply
                </button>
                <button
                    type="button"
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    All time
                </button>
            </form>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Revenue"
                    value={formatCurrency(stats.totals.revenue)}
                    color="text-green-400"
                />
                <SummaryCard
                    title="Total Orders"
                    value={String(stats.totals.orders)}
                    color="text-blue-400"
                />
                <SummaryCard
                    title="Avg. Order Value"
                    value={formatCurrency(stats.totals.avgOrderValue)}
                    color="text-yellow-400"
                />
                <SummaryCard
                    title="Paid Orders"
                    value={String(stats.statusCounts.paid ?? 0)}
                    subtitle={`${stats.statusCounts.pending ?? 0} pending · ${stats.statusCounts.cancelled ?? 0} cancelled`}
                    color="text-purple-400"
                />
            </div>

            {/* Sales per day chart */}
            <div className="bg-gray-900/60 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Sales per Day</h3>
                {stats.dailySales.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No sales data for this period.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={stats.dailySales} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: "#999", fontSize: 12 }}
                                tickFormatter={(d: string) => {
                                    const date = new Date(d);
                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                            />
                            <YAxis
                                tick={{ fill: "#999", fontSize: 12 }}
                                tickFormatter={(v: number) => `$${v}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1f2937",
                                    border: "1px solid #374151",
                                    borderRadius: "8px",
                                    color: "#fff",
                                }}
                                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                                labelFormatter={(label: string) => {
                                    const d = new Date(label + "T00:00:00");
                                    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                                }}
                            />
                            <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} />
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#facc15" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    subtitle,
    color,
}: {
    title: string;
    value: string;
    subtitle?: string;
    color: string;
}) {
    return (
        <div className="bg-gray-900/60 border border-white/10 rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}
