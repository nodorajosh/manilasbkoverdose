// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";
import Order from "@/models/Order";
import { sendMail } from "@/lib/mailer";

/**
 * Payload:
 * { ticketId: string, quantity?: number, paymentLink?: string|null, depositInstructions?: string|null }
 *
 * Creates an Order document with status "pending" and returns it.
 */
const createOrderSchema = z.object({
    ticketId: z.string().min(1),
    quantity: z.number().int().min(1).optional().default(1),
    paymentLink: z.string().url().optional().nullable(),
    depositInstructions: z.string().optional().nullable(),
});

export async function POST(req: Request) {
    try {
        // check session
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = createOrderSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const { ticketId, quantity, paymentLink, depositInstructions } = parsed.data;

        await connectMongoose();

        // Find ticket
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        const remaining = Math.max(0, (ticket.quantity ?? 0) - (ticket.sold ?? 0));
        if (remaining <= 0) {
            return NextResponse.json({ error: "Ticket sold out" }, { status: 400 });
        }
        if (quantity > remaining) {
            return NextResponse.json({ error: `Only ${remaining} ticket(s) remaining` }, { status: 400 });
        }

        // Compose order item
        const item = {
            ticketId: ticket._id,
            name: ticket.name,
            price: ticket.price,
            currency: ticket.currency ?? "USD",
            quantity,
        };

        // Create order with status 'pending'
        const order = await Order.create({
            userId: session.user.email,
            userEmail: session.user.email,
            items: [item],
            totalAmount: ticket.price * quantity,
            currency: ticket.currency ?? "USD",
            status: "pending",
            paymentDetails: {
                method: "wise",
                paymentLink: paymentLink ?? null,
                depositInstructions: depositInstructions ?? null,
            },
        });

        // Send "Order Created" email
        await sendMail({
            to: session.user.email,
            subject: "Your order has been created",
            html: `
        <h1>Order Created</h1>
        <p>Thank you, ${session.user.name ? session.user.name : session.user.email.split("@")[0]} for ordering <strong>${ticket.name}</strong>.</p>
        <p>Status: <b>Pending</b></p>
        <p>Please complete your payment using the Wise payment link provided.</p>
        <br />
        <br />
        <p><a href="${paymentLink}">Pay with Wise</a></p>
        ${depositInstructions ? `<h2>Deposit Instructions</h2><p>${depositInstructions}</p>` : ""}
        <h2>Order Summary</h2>
      `,
        });

        return NextResponse.json({ order });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Create order error:", err?.response || err?.message || err);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
