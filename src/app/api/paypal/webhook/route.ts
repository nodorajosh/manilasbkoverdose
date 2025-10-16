// app/api/paypal/webhook/route.ts
import { NextResponse } from "next/server";
import { verifyPaypalWebhook } from "@/lib/paypal";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";
import { Ticket } from "@/models/Ticket";
import { sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
    try {
        const headers = {
            "paypal-transmission-id": req.headers.get("paypal-transmission-id") ?? "",
            "paypal-transmission-time": req.headers.get("paypal-transmission-time") ?? "",
            "paypal-transmission-sig": req.headers.get("paypal-transmission-sig") ?? "",
            "paypal-cert-url": req.headers.get("paypal-cert-url") ?? "",
            "paypal-auth-algo": req.headers.get("paypal-auth-algo") ?? "",
        };

        const body = await req.json();

        // verify signature
        const ok = await verifyPaypalWebhook(headers, body);
        if (!ok) {
            console.warn("PayPal webhook signature verification failed");
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        await connectMongoose();

        const eventType = body.event_type as string;
        // handle payment capture completed
        if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.DENIED") {
            // extract resource
            const resource = body.resource as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            // resource will vary; try to find reference or invoice_id
            const referenceId = resource.supplementary_data?.related_ids?.order_id ?? resource.invoice_id ?? resource.order_id ?? resource.id;
            // try to match Order.paymentDetails.paypalOrderId or reference_id
            const order = await Order.findOne({
                $or: [
                    { "paymentDetails.paypalOrderId": referenceId },
                    { "paymentDetails.paypalOrderId": resource.order_id },
                    { "paymentDetails.referenceId": referenceId },
                    { _id: referenceId },
                ],
            });

            if (!order) {
                console.warn("Webhook couldn't find order for reference:", referenceId);
                return NextResponse.json({ ok: true });
            }

            if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
                order.status = "paid";
                order.paymentConfirmedAt = new Date();
                order.paymentDetails = order.paymentDetails ?? {};
                order.paymentDetails.paypalCapture = order.paymentDetails.paypalCapture ?? [];
                // push resource id
                order.paymentDetails.paypalCapture.push({ id: resource.id, amount: resource.amount ?? null });
                await order.save();

                // decrement inventory
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
                        to: order.userEmail,
                        subject: "Payment confirmed",
                        html: `<p>Your payment for order ${order._id} is complete.</p>`,
                    });
                } catch (e) {
                    console.warn("webhook sendMail failed", e);
                }
            } else if (eventType === "PAYMENT.CAPTURE.DENIED") {
                order.status = "failed";
                await order.save();
            }

            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("paypal webhook error:", err);
        return NextResponse.json({ error: "webhook handler error" }, { status: 500 });
    }
}
