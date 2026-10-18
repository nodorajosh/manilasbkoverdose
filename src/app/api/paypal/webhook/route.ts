import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyPaypalWebhook } from "@/lib/paypal";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";
import { Ticket } from "@/models/Ticket";
import { sendMail } from "@/lib/mailer";

type PaypalResource = {
    id?: string;
    order_id?: string;
    invoice_id?: string;
    amount?: unknown;
    supplementary_data?: {
        related_ids?: {
            order_id?: string;
        };
    };
};

export async function POST(req: Request) {
    try {
        const headers = {
            "paypal-transmission-id": req.headers.get("paypal-transmission-id") ?? "",
            "paypal-transmission-time": req.headers.get("paypal-transmission-time") ?? "",
            "paypal-transmission-sig": req.headers.get("paypal-transmission-sig") ?? "",
            "paypal-cert-url": req.headers.get("paypal-cert-url") ?? "",
            "paypal-auth-algo": req.headers.get("paypal-auth-algo") ?? "",
        };
        const body = await req.json() as { event_type?: string; resource?: PaypalResource };
        if (!await verifyPaypalWebhook(headers, body)) {
            console.warn("PayPal webhook signature verification failed");
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        await connectMongoose();
        const eventType = body.event_type;
        if (eventType !== "PAYMENT.CAPTURE.COMPLETED" && eventType !== "PAYMENT.CAPTURE.DENIED") {
            return NextResponse.json({ ok: true });
        }

        const resource = body.resource ?? {};
        const paypalOrderIds = [
            resource.supplementary_data?.related_ids?.order_id,
            resource.order_id,
        ].filter((value): value is string => Boolean(value));
        const orderFilters: Record<string, unknown>[] = paypalOrderIds.map((value) => ({
            "paymentDetails.paypalOrderId": value,
        }));
        if (resource.invoice_id && mongoose.isValidObjectId(resource.invoice_id)) {
            orderFilters.push({ _id: resource.invoice_id });
        }
        if (orderFilters.length === 0) {
            console.warn("Webhook missing an order reference");
            return NextResponse.json({ ok: true });
        }

        const order = await Order.findOne({ $or: orderFilters });
        if (!order) {
            console.warn("Webhook couldn't find order for references:", paypalOrderIds);
            return NextResponse.json({ ok: true });
        }

        if (eventType === "PAYMENT.CAPTURE.DENIED") {
            await Order.updateOne({ _id: order._id, status: "pending" }, { $set: { status: "failed" } });
            return NextResponse.json({ ok: true });
        }

        const transitioned = await Order.findOneAndUpdate(
            {
                _id: order._id,
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

        if (resource.id) {
            await Order.updateOne(
                {
                    _id: order._id,
                    "paymentDetails.paypalCapture.id": { $ne: resource.id },
                },
                {
                    $push: {
                        "paymentDetails.paypalCapture": {
                            id: resource.id,
                            amount: resource.amount ?? null,
                        },
                    },
                }
            );
        }

        if (transitioned) {
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
                    to: transitioned.userEmail ?? transitioned.userId,
                    subject: "Payment confirmed",
                    html: `<p>Your payment for order ${transitioned._id} is complete.</p>`,
                });
            } catch (error) {
                console.warn("webhook sendMail failed", error);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("paypal webhook error:", err);
        return NextResponse.json({ error: "webhook handler error" }, { status: 500 });
    }
}
