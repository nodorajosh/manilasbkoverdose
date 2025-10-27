// app/api/paypal/create-order/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import { createPaypalOrder } from "@/lib/paypal";
import { Ticket } from "@/models/Ticket";
import Order from "@/models/Order";
import Discount from "@/models/Discount";
import { sendMail } from "@/lib/mailer";
import mongoose from "mongoose";

const singleSchema = z.object({
    ticketId: z.string().min(1),
    quantity: z.number().int().min(1).optional().default(1),
    discountCode: z.string().optional().nullable(),
});
const itemsSchema = z.object({
    items: z
        .array(
            z.object({
                ticketId: z.string().min(1),
                quantity: z.number().int().min(1),
                discountCode: z.string().optional().nullable(),
            })
        )
        .min(1),
});

const payloadSchema = z.union([singleSchema, itemsSchema]);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const body = await req.json();
        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        await connectMongoose();

        // normalize items
        let itemsInput: { ticketId: string; quantity: number; discountCode?: string | null }[] = [];
        if ("items" in parsed.data) {
            itemsInput = parsed.data.items.map((i) => ({ ticketId: i.ticketId, quantity: i.quantity, discountCode: i.discountCode ?? null }));
        } else {
            const single = parsed.data as z.infer<typeof singleSchema>;
            itemsInput = [{ ticketId: single.ticketId, quantity: single.quantity, discountCode: single.discountCode ?? null }];
        }

        // load tickets
        const ticketIds = itemsInput.map((i) => i.ticketId);
        const tickets = await Ticket.find({ _id: { $in: ticketIds } }).lean();

        if (tickets.length !== ticketIds.length) {
            const foundIds = new Set(tickets.map((t) => String(t._id)));
            const missing = ticketIds.filter((id) => !foundIds.has(id));
            return NextResponse.json({ error: `Ticket(s) not found: ${missing.join(", ")}` }, { status: 404 });
        }

        // build validated order items and compute totals server-side
        const orderItems: {
            ticketId: string;
            name: string;
            price: number; // unit price after discount
            currency: string;
            quantity: number;
            discountId?: string | null;
            discountCode?: string | null;
            originalUnitPrice?: number;
        }[] = [];

        let currencyRef: string | null = null;

        for (const reqItem of itemsInput) {
            const ticket = tickets.find((t) => String(t._id) === reqItem.ticketId);
            if (!ticket) return NextResponse.json({ error: `Ticket not found: ${reqItem.ticketId}` }, { status: 404 });

            const remaining = Math.max(0, (ticket.quantity ?? 0) - (ticket.sold ?? 0));
            if (remaining <= 0) return NextResponse.json({ error: `Ticket sold out: ${ticket.name}` }, { status: 400 });
            if (reqItem.quantity > remaining) return NextResponse.json({ error: `Only ${remaining} left for ${ticket.name}` }, { status: 400 });

            const unitPrice = Number(ticket.price);
            if (Number.isNaN(unitPrice)) return NextResponse.json({ error: `Invalid price for ticket ${ticket.name}` }, { status: 500 });

            const ticketCurrency = ticket.currency ?? "USD";
            if (!currencyRef) currencyRef = ticketCurrency;
            else if (currencyRef !== ticketCurrency) return NextResponse.json({ error: "All items must use the same currency" }, { status: 400 });

            // default price is ticket price
            let finalUnitPrice = unitPrice;
            let appliedDiscountId: string | undefined = undefined;
            let appliedDiscountCode: string | undefined = undefined;

            // if discountCode provided, validate and compute
            if (reqItem.discountCode) {
                const code = String(reqItem.discountCode).trim().toUpperCase();
                const discount = await Discount.findOne({ code, active: true });
                if (!discount) return NextResponse.json({ error: `Invalid or inactive discount code: ${code}` }, { status: 400 });

                if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
                    return NextResponse.json({ error: `Discount code ${code} expired` }, { status: 400 });
                }

                if (discount.maxUses !== null && discount.used >= discount.maxUses) {
                    return NextResponse.json({ error: `Discount code ${code} has reached its usage limit` }, { status: 400 });
                }

                // check appliesTo
                if (Array.isArray(discount.appliesTo) && discount.appliesTo.length > 0) {
                    const applies = discount.appliesTo.map(String);
                    if (!applies.includes(String(ticket._id))) {
                        return NextResponse.json({ error: `Discount ${code} does not apply to ticket ${ticket.name}` }, { status: 400 });
                    }
                }

                if (discount.type === "fixed") {
                    // discount.value is cents => convert to decimal
                    finalUnitPrice = Math.max(0, unitPrice - Number(discount.value) / 100);
                } else {
                    finalUnitPrice = Math.max(0, unitPrice * (1 - Number(discount.value) / 100));
                }
                finalUnitPrice = Number(finalUnitPrice.toFixed(2));
                appliedDiscountId = String(discount._id);
                appliedDiscountCode = discount.code;
            }

            orderItems.push({
                ticketId: String(ticket._id),
                name: ticket.name,
                price: finalUnitPrice,
                currency: ticketCurrency,
                quantity: reqItem.quantity,
                discountId: appliedDiscountId ?? undefined,
                discountCode: appliedDiscountCode ?? undefined,
                originalUnitPrice: unitPrice,
            });
        }

        // compute totals
        const totalAmountNumber = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
        const totalString = totalAmountNumber.toFixed(2);
        const currency = currencyRef ?? "USD";

        // create order
        const orderDoc = await Order.create({
            userId: session.user.email,
            userEmail: session.user.email,
            items: orderItems.map((it) => ({
                ticketId: new mongoose.Types.ObjectId(it.ticketId),
                name: it.name,
                price: it.price,
                currency: it.currency,
                quantity: it.quantity,
            })),
            totalAmount: totalAmountNumber,
            currency,
            status: "pending",
            paymentDetails: {
                method: "paypal",
                paymentLink: null,
                paypalOrderId: null,
            },
            // store applied discounts meta on order for auditing
            metadata: {
                discounts: orderItems
                    .filter((it) => it.discountId)
                    .map((it) => ({ ticketId: it.ticketId, discountId: it.discountId, discountCode: it.discountCode })),
            },
        });

        // atomically increment discount.used for applied discounts
        const appliedDiscountIds = [...new Set(orderItems.filter((it) => it.discountId).map((it) => it.discountId))].filter(Boolean) as string[];
        for (const dId of appliedDiscountIds) {
            try {
                await Discount.updateOne({ _id: dId, $expr: { $lt: ["$used", { $ifNull: ["$maxUses", Number.MAX_SAFE_INTEGER] }] } }, { $inc: { used: 1 } }).exec();
            } catch (err) {
                console.warn("Failed to increment discount used counter for", dId, err);
            }
        }

        const returnUrl = `${process.env.NEXTAUTH_URL}/checkout/complete?orderId=${orderDoc._id}`;
        const cancelUrl = `${process.env.NEXTAUTH_URL}/checkout/cancel?orderId=${orderDoc._id}`;

        try {
            const { paypalOrderId, approveUrl } = await createPaypalOrder({
                email: session.user.email,
                total: totalString,
                currency,
                returnUrl,
                cancelUrl,
                referenceId: String(orderDoc._id),
            });

            orderDoc.paymentDetails = orderDoc.paymentDetails ?? {};
            orderDoc.paymentDetails.paypalOrderId = paypalOrderId ?? null;
            orderDoc.paymentDetails.paymentLink = approveUrl ?? null;
            await orderDoc.save();

            // email (non-blocking)
            try {
                const itemsHtml = orderItems.map((it) => `<li>${it.name} — ${it.quantity} × ${it.price.toFixed(2)} ${it.currency}</li>`).join("");
                await sendMail({
                    to: session.user.email,
                    subject: "Order created — complete payment",
                    html: `
            <h1>Order Created</h1>
            <p>Thank you for your order. Please complete payment using the link below.</p>
            <p><strong>Order ID:</strong> ${orderDoc._id}</p>
            <p><strong>Total:</strong> ${totalString} ${currency}</p>
            <h3>Items</h3>
            <ul>${itemsHtml}</ul>
            <p><a href="${approveUrl}">Pay with PayPal</a></p>
          `,
                });
            } catch (mailErr) {
                console.warn("Order-created email failed:", mailErr);
            }

            return NextResponse.json({ orderId: String(orderDoc._id), paypalOrderId, approveUrl });
        } catch (paypalErr) {
            console.error("PayPal order creation failed:", paypalErr);
            orderDoc.status = "failed";
            await orderDoc.save();
            return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
        }
    } catch (err) {
        console.error("create-order error:", err);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
