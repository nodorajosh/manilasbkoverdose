// app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";
import { sendMail } from "@/lib/mailer";
import User from "@/models/User";

const updateSchema = z.object({
    orderId: z.string().min(1),
    status: z.enum(["pending", "paid", "cancelled", "refunded", "fulfilled"]),
});

export async function GET() {
    try {
        await connectMongoose();
        const orders = await Order.find().sort({ createdAt: -1 }).populate("items.ticketId");
        return NextResponse.json({ orders });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();

        const order = await Order.findById(parsed.data.orderId);
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        order.status = parsed.data.status;
        if (parsed.data.status === "paid") {
            order.paymentConfirmedAt = new Date();
            // reduce inventory atomically for each item
            for (const itm of order.items) {
                const Ticket = (await import("@/models/Ticket")).Ticket;
                await Ticket.updateOne({ _id: itm.ticketId }, { $inc: { sold: itm.quantity } });
            }
        }

        await order.save(async (err: any, order: any) => { //eslint-disable-line @typescript-eslint/no-explicit-any
            if (err) {
                return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
            }
            if (order.status === "paid") {
                // send email to user about status update
                const purchaser = await User.findOne({ email: order.userEmail });
                await sendMail({
                    to: order.userEmail,
                    subject: "Your order is confirmed",
                    html: `
                <h1>Payment Confirmed</h1>
                <p>Hi, ${purchaser.name ? purchaser.name : purchaser.email.split("@")[0]} Your order for <strong>${order.items.length}</strong> item(s) has been confirmed.</p>
                <p>Status: <b>Paid</b></p>
                <p>Confirmation ID: <code>${order._id}</code></p>
                <br />
                <p>We look forward to seeing you at the event!</p>
                `,
                });
            }
            if (order.status === "cancelled") {
                // send email to user about status update
                const purchaser = await User.findOne({ email: order.userEmail });
                await sendMail({
                    to: order.userEmail,
                    subject: "Your order has been cancelled",
                    html: `
                <h1>Order Cancelled</h1>
                <p>Hi, ${purchaser.name ? purchaser.name : purchaser.email.split("@")[0]} Your order for <strong>${order.items.length}</strong> item(s) has been cancelled.</p>
                <p>Status: <b>Cancelled</b></p>
                `,
                });
            }
        });

        return NextResponse.json({ order });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("update order error:", err);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
