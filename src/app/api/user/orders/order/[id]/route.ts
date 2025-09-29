// app/api/user/orders/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        await connectMongoose();

        // fetch order
        const order = await Order.findById(id).populate("items.ticketId");
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        // Admin can view any order
        const isAdmin = (session.user as any).role === "admin"; //eslint-disable-line @typescript-eslint/no-explicit-any
        if (!isAdmin) {
            // restrict to owner
            // assumes order.customer.email or order.userEmail — adapt if your schema differs
            const ownerEmail = order.userId ?? null;
            if (!ownerEmail || ownerEmail !== session.user.email) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json({ order });
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("GET /api/orders/order/[id] error:", err);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}
