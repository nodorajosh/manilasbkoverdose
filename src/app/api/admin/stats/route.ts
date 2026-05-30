// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectMongoose();

        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        // Build date filter
        const dateFilter: Record<string, Date> = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) {
            // Include the entire "to" day
            const end = new Date(to);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }

        const matchStage: Record<string, unknown> = { status: "paid" };
        if (from || to) {
            matchStage.createdAt = dateFilter;
        }

        // Aggregate sales per day
        const dailySales = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Total stats
        const totalAgg = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: "$totalAmount" },
                },
            },
        ]);

        const totals = totalAgg[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

        // Status breakdown
        const statusBreakdown = await Order.aggregate([
            {
                $match: from || to
                    ? { createdAt: dateFilter }
                    : {},
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const statusCounts: Record<string, number> = {};
        for (const s of statusBreakdown) {
            statusCounts[s._id] = s.count;
        }

        return NextResponse.json({
            dailySales: dailySales.map((d) => ({
                date: d._id,
                revenue: d.revenue,
                orders: d.orders,
            })),
            totals: {
                revenue: totals.totalRevenue,
                orders: totals.totalOrders,
                avgOrderValue: Math.round(totals.avgOrderValue * 100) / 100,
            },
            statusCounts,
        });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Admin stats error:", err);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
