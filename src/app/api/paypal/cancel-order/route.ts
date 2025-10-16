// app/api/paypal/cancel-order/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";
import { sendMail } from "@/lib/mailer";

const schema = z.object({
    orderId: z.string().min(1),
    reason: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const { orderId, reason } = parsed.data;

        await connectMongoose();

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Authorization: owner or admin
        const currentEmail = session.user.email;
        const isAdmin = (session.user as any)?.role === "admin"; // eslint-disable-line @typescript-eslint/no-explicit-any

        // If not admin and not the owner -> forbidden
        if (!isAdmin && String(order.userEmail) !== String(currentEmail)) {
            return NextResponse.json({ error: "Unauthorized to cancel this order" }, { status: 403 });
        }

        // If order already cancelled, return it
        if (order.status === "cancelled") {
            return NextResponse.json({ order });
        }

        // If order is paid and user is not admin -> disallow cancellation here
        if (!isAdmin && order.status === "paid") {
            return NextResponse.json({ error: "Cannot cancel a paid order. Please contact support for a refund.", status: 400 }, { status: 400 });
        }

        // Proceed to cancel
        order.status = "cancelled";

        await order.save();

        // Send cancellation email (best-effort; do not block on failure)
        (async () => {
            try {
                await sendMail({
                    to: order.userEmail,
                    subject: `Your order ${order._id} has been cancelled`,
                    html: `
            <h1>Order Cancelled</h1>
            <p>Your order <strong>${order._id}</strong> has been cancelled.</p>
            <p><strong>Status:</strong> Cancelled</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>If you believe this is a mistake or you need a refund, please contact support.</p>
          `,
                });
            } catch (mailErr) {
                console.error("Cancellation email failed:", mailErr);
            }
        })();

        return NextResponse.json({ order });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("cancel-order error:", err);
        return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
    }
}
