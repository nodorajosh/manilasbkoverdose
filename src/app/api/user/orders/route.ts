// app/api/user/orders/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await connectMongoose();

        const orders = await Order.find({ "userId": session.user.email })
            .sort({ createdAt: -1 })
            .populate("items.ticketId")
            .lean();

        return NextResponse.json({ orders });
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("User orders GET failed:", err);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

/**
 * PATCH - allow the user to cancel their own pending orders
 * body: { _id: string, status: 'cancelled' | 'request-cancel' }
 */
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const { _id, status } = body as { _id?: string; status?: string };

        if (!_id || !status) {
            return NextResponse.json({ error: "_id and status required" }, { status: 400 });
        }

        await connectMongoose();

        const order = await Order.findById(_id);
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        // ensure owner
        if (String(order.customer?.email) !== session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // only allow cancellation from certain states
        if (status === "cancelled") {
            if (!["pending", "created"].includes(order.status)) {
                return NextResponse.json({ error: "Cannot cancel order in this status" }, { status: 400 });
            }
            order.status = "cancelled";
            order.cancelledAt = new Date();
            await order.save();
            return NextResponse.json({ order });
        }

        // unrecognized
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("User orders PATCH failed:", err);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
