// app/api/paypal/create-order/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import { createPaypalOrder } from "@/lib/paypal";
import { Ticket } from "@/models/Ticket";
import Order from "@/models/Order";
import { sendMail } from "@/lib/mailer";

const singleSchema = z.object({
    ticketId: z.string().min(1),
    quantity: z.number().int().min(1).optional().default(1),
});
const itemsSchema = z.object({
    items: z
        .array(
            z.object({
                ticketId: z.string().min(1),
                quantity: z.number().int().min(1),
            })
        )
        .min(1),
});

// Accept either { ticketId, quantity } OR { items: [...] }
const payloadSchema = z.union([singleSchema, itemsSchema]);

type ValidatedSingle = z.infer<typeof singleSchema>;
// type ValidatedItems = z.infer<typeof itemsSchema>;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();

        // normalize items array
        let itemsInput: { ticketId: string; quantity: number }[] = [];
        if ("items" in parsed.data) {
            itemsInput = parsed.data.items;
        } else {
            const single = parsed.data as ValidatedSingle;
            itemsInput = [{ ticketId: single.ticketId, quantity: single.quantity }];
        }

        // Load tickets from DB and validate availability & collect pricing
        const ticketIds = itemsInput.map((i) => i.ticketId);
        const tickets = await Ticket.find({ _id: { $in: ticketIds } }).lean();

        // ensure we fetched all tickets
        if (tickets.length !== ticketIds.length) {
            const foundIds = new Set(tickets.map((t) => String(t._id)));
            const missing = ticketIds.filter((id) => !foundIds.has(id));
            return NextResponse.json({ error: `Ticket(s) not found: ${missing.join(", ")}` }, { status: 404 });
        }

        // Build order items, validate quantity and currency consistency
        const orderItems: {
            ticketId: string;
            name: string;
            price: number;
            currency: string;
            quantity: number;
        }[] = [];

        let currencyRef: string | null = null;
        for (const reqItem of itemsInput) {
            const ticket = tickets.find((t) => String(t._id) === reqItem.ticketId);
            if (!ticket) {
                return NextResponse.json({ error: `Ticket not found: ${reqItem.ticketId}` }, { status: 404 });
            }
            const remaining = Math.max(0, (ticket.quantity ?? 0) - (ticket.sold ?? 0));
            if (remaining <= 0) {
                return NextResponse.json({ error: `Ticket sold out: ${ticket.name}` }, { status: 400 });
            }
            if (reqItem.quantity > remaining) {
                return NextResponse.json({ error: `Only ${remaining} left for ${ticket.name}` }, { status: 400 });
            }

            const unitPrice = Number(ticket.price);
            if (Number.isNaN(unitPrice)) {
                return NextResponse.json({ error: `Invalid price for ticket ${ticket.name}` }, { status: 500 });
            }

            const ticketCurrency = ticket.currency ?? "USD";
            if (!currencyRef) currencyRef = ticketCurrency;
            else if (currencyRef !== ticketCurrency) {
                return NextResponse.json({ error: "All items must use the same currency" }, { status: 400 });
            }

            orderItems.push({
                ticketId: String(ticket._id),
                name: ticket.name,
                price: unitPrice,
                currency: ticketCurrency,
                quantity: reqItem.quantity,
            });
        }

        // compute totals
        const totalAmountNumber = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
        const totalString = totalAmountNumber.toFixed(2);
        const currency = currencyRef ?? "USD";

        // create internal order (pending)
        const orderDoc = await Order.create({
            userId: session.user.email,
            userEmail: session.user.email,
            items: orderItems.map((it) => ({
                ticketId: it.ticketId,
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
        });

        // build urls for PayPal redirect/capture mapping back to our internal order
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

            // persist paypal info on order
            orderDoc.paymentDetails = orderDoc.paymentDetails ?? {};
            orderDoc.paymentDetails.paypalOrderId = paypalOrderId ?? null;
            orderDoc.paymentDetails.paymentLink = approveUrl ?? null;
            await orderDoc.save();

            // send order-created email to purchaser (non-blocking if mail fails)
            try {
                const itemsHtml = orderItems
                    .map((it) => `<li>${it.name} — ${it.quantity} × ${it.price.toFixed(2)} ${it.currency}</li>`)
                    .join("");
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
                console.error("Order-created email failed:", mailErr);
            }

            return NextResponse.json({ orderId: String(orderDoc._id), paypalOrderId, approveUrl });
        } catch (paypalErr) {
            console.error("PayPal order creation failed:", paypalErr);
            // mark order failed so it is visible for inspection / retry
            orderDoc.status = "failed";
            await orderDoc.save();
            return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
        }
    } catch (err) {
        console.error("create-order error:", err);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
