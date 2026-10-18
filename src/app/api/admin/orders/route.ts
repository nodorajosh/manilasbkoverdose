import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";
import { Ticket } from "@/models/Ticket";
import { sendMail } from "@/lib/mailer";
import User from "@/models/User";

const updateSchema = z.object({
    orderId: z.string().min(1),
    status: z.enum(["pending", "paid", "failed", "cancelled", "refunded", "fulfilled"]),
}).strict();

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectMongoose();
        const orders = await Order.find().sort({ createdAt: -1 }).populate("items.ticketId");
        return NextResponse.json({ orders });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const parsed = updateSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();
        const existing = await Order.findById(parsed.data.orderId);
        if (!existing) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const previousStatus = existing.status;
        let order;
        let transitionedToPaid = false;
        if (parsed.data.status === "paid" && previousStatus !== "paid") {
            order = await Order.findOneAndUpdate(
                {
                    _id: existing._id,
                    status: { $ne: "paid" },
                    paymentConfirmedAt: null,
                },
                {
                    $set: {
                        status: "paid",
                        paymentConfirmedAt: new Date(),
                    },
                },
                { new: true }
            );
            transitionedToPaid = Boolean(order);
            if (!order) {
                order = await Order.findByIdAndUpdate(
                    existing._id,
                    { $set: { status: "paid" } },
                    { new: true }
                );
            }
        } else {
            const update: Record<string, unknown> = { status: parsed.data.status };
            if (parsed.data.status === "cancelled" && previousStatus !== "cancelled") {
                update.cancelledAt = new Date();
            }
            order = await Order.findByIdAndUpdate(existing._id, { $set: update }, { new: true });
        }

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (transitionedToPaid) {
            for (const item of order.items ?? []) {
                if (item.ticketId) {
                    await Ticket.updateOne(
                        { _id: item.ticketId },
                        { $inc: { sold: item.quantity ?? 1 } }
                    );
                }
            }
        }

        const shouldNotifyPaid = transitionedToPaid;
        const shouldNotifyCancelled = parsed.data.status === "cancelled" && previousStatus !== "cancelled";
        if (shouldNotifyPaid || shouldNotifyCancelled) {
            const recipient = order.userEmail ?? order.userId;
            const purchaser = await User.findOne({ email: recipient });
            const purchaserName = purchaser?.name ?? purchaser?.email?.split("@")[0] ?? recipient.split("@")[0];
            if (shouldNotifyPaid) {
                await sendMail({
                    to: recipient,
                    subject: "Your order is confirmed",
                    html: `
                <h1>Payment Confirmed</h1>
                <p>Hi, ${purchaserName} Your order for <strong>${order.items.length}</strong> item(s) has been confirmed.</p>
                <p>Status: <b>Paid</b></p>
                <p>Confirmation ID: <code>${order._id}</code></p>
                <br />
                <p>We look forward to seeing you at the event!</p>
                `,
                });
            }
            if (shouldNotifyCancelled) {
                await sendMail({
                    to: recipient,
                    subject: "Your order has been cancelled",
                    html: `
                <h1>Order Cancelled</h1>
                <p>Hi, ${purchaserName} Your order for <strong>${order.items.length}</strong> item(s) has been cancelled.</p>
                <p>Status: <b>Cancelled</b></p>
                `,
                });
            }
        }

        return NextResponse.json({ order });
    } catch (err) {
        console.error("update order error:", err);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
