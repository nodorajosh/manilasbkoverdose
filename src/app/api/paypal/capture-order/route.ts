// app/api/paypal/capture-order/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import { capturePaypalOrder } from "@/lib/paypal";
import Order from "@/models/Order";
import { Ticket } from "@/models/Ticket";
import { sendMail } from "@/lib/mailer";

const schema = z.object({
    orderId: z.string().min(1), // our internal order id
    paypalOrderId: z.string().min(1), // PayPal order id (token)
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const body = await req.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const { orderId, paypalOrderId } = parsed.data;

        await connectMongoose();

        const order = await Order.findById(orderId);
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        // Only allow the owner or admin to capture (safety). Admin check via session role.
        const isOwner = order.userEmail === session.user.email || order.userId === session.user.email;
        if (!isOwner && (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Execute capture with PayPal
        const captureResp = await capturePaypalOrder(paypalOrderId);

        // PayPal returns purchase_units[].payments.captures[]; collect capture ids
        const captures: Array<{ id: string; amount?: any }> = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const pus = captureResp.purchase_units ?? [];
            for (const pu of pus) {
                const pays = (pu.payments?.captures ?? []) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
                for (const c of pays) {
                    captures.push({ id: c.id, amount: c.amount });
                }
            }
            // some responses also return top-level captures
            if (captureResp.payments?.captures) {
                for (const c of captureResp.payments.captures) captures.push({ id: c.id, amount: c.amount });
            }
        } catch (e) {
            console.warn("unable to parse capture response structure", e);
        }

        // update order: mark paid, store paypal details
        order.status = "paid";
        order.paymentConfirmedAt = new Date();
        order.paymentDetails = order.paymentDetails ?? {};
        order.paymentDetails.paypalOrderId = paypalOrderId;
        order.paymentDetails.paymentLink = order.paymentDetails.paymentLink ?? null;
        order.paymentDetails.paypalCapture = captures;
        await order.save();

        // reduce ticket inventory
        if (Array.isArray(order.items)) {
            for (const it of order.items) {
                if (it.ticketId) {
                    await Ticket.updateOne({ _id: it.ticketId }, { $inc: { sold: it.quantity ?? 1 } });
                }
            }
        }

        // send confirmation email
        try {
            await sendMail({
                to: order.userEmail ?? session.user.email,
                subject: "Order paid — confirmation",
                html: `<h2>Payment received</h2>
               <p>Thanks — we received payment for Order <strong>${order._id}</strong>.</p>
               <p>PayPal order: ${paypalOrderId}</p>`,
            });
        } catch (e) {
            console.warn("sendMail after capture failed", e);
        }

        return NextResponse.json({ success: true, capture: captures });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("capture-order error:", err);
        return NextResponse.json({ error: "Failed to capture PayPal order" }, { status: 500 });
    }
}
