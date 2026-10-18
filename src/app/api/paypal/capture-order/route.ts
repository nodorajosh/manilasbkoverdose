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
    orderId: z.string().min(1),
    paypalOrderId: z.string().min(1),
}).strict();

type PaypalCapture = {
    id: string;
    amount?: unknown;
};

function getCaptures(response: Record<string, unknown>) {
    const captures: PaypalCapture[] = [];
    const purchaseUnits = Array.isArray(response.purchase_units) ? response.purchase_units : [];
    for (const purchaseUnit of purchaseUnits) {
        const unit = purchaseUnit as { payments?: { captures?: PaypalCapture[] } };
        for (const capture of unit.payments?.captures ?? []) {
            if (capture.id) captures.push({ id: capture.id, amount: capture.amount });
        }
    }
    const payments = response.payments as { captures?: PaypalCapture[] } | undefined;
    for (const capture of payments?.captures ?? []) {
        if (capture.id) captures.push({ id: capture.id, amount: capture.amount });
    }
    return [...new Map(captures.map((capture) => [capture.id, capture])).values()];
}

async function storeCaptures(orderId: string, captures: PaypalCapture[]) {
    for (const capture of captures) {
        await Order.updateOne(
            { _id: orderId, "paymentDetails.paypalCapture.id": { $ne: capture.id } },
            { $push: { "paymentDetails.paypalCapture": capture } }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        if (!session.user.profileComplete) {
            return NextResponse.json({ error: "Complete your profile before paying" }, { status: 403 });
        }

        const parsed = schema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();
        const { orderId, paypalOrderId } = parsed.data;
        const order = await Order.findById(orderId);
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        const isOwner = order.userEmail === session.user.email || order.userId === session.user.email;
        if (!isOwner && session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        if (String(order.paymentDetails?.paypalOrderId ?? "") !== paypalOrderId) {
            return NextResponse.json({ error: "PayPal order id does not match" }, { status: 400 });
        }
        if (order.status === "paid") {
            return NextResponse.json({
                success: true,
                capture: order.paymentDetails?.paypalCapture ?? [],
                idempotent: true,
            });
        }
        if (order.status !== "pending") {
            return NextResponse.json({ error: `Cannot capture an order with status ${order.status}` }, { status: 409 });
        }

        let captureResponse: Record<string, unknown>;
        try {
            captureResponse = await capturePaypalOrder(paypalOrderId) as Record<string, unknown>;
        } catch (captureError) {
            const current = await Order.findById(orderId);
            if (current?.status === "paid") {
                return NextResponse.json({
                    success: true,
                    capture: current.paymentDetails?.paypalCapture ?? [],
                    idempotent: true,
                });
            }
            throw captureError;
        }
        if (captureResponse.status !== "COMPLETED") {
            return NextResponse.json({ error: "PayPal capture did not complete" }, { status: 502 });
        }

        const captures = getCaptures(captureResponse);
        const transitioned = await Order.findOneAndUpdate(
            {
                _id: orderId,
                status: "pending",
                paymentConfirmedAt: null,
                "paymentDetails.paypalOrderId": paypalOrderId,
            },
            {
                $set: {
                    status: "paid",
                    paymentConfirmedAt: new Date(),
                },
            },
            { new: true }
        );

        await storeCaptures(orderId, captures);
        if (!transitioned) {
            const current = await Order.findById(orderId);
            if (current?.status === "paid") {
                return NextResponse.json({ success: true, capture: captures, idempotent: true });
            }
            return NextResponse.json({ error: "Order state changed before capture completed" }, { status: 409 });
        }

        for (const item of transitioned.items ?? []) {
            if (item.ticketId) {
                await Ticket.updateOne(
                    { _id: item.ticketId },
                    { $inc: { sold: item.quantity ?? 1 } }
                );
            }
        }

        try {
            await sendMail({
                to: transitioned.userEmail ?? session.user.email,
                subject: "Order paid — confirmation",
                html: `<h2>Payment received</h2>
               <p>Thanks — we received payment for Order <strong>${transitioned._id}</strong>.</p>
               <p>PayPal order: ${paypalOrderId}</p>`,
            });
        } catch (error) {
            console.warn("sendMail after capture failed", error);
        }

        return NextResponse.json({ success: true, capture: captures });
    } catch (err) {
        console.error("capture-order error:", err);
        return NextResponse.json({ error: "Failed to capture PayPal order" }, { status: 500 });
    }
}
