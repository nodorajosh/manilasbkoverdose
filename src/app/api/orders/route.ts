import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";
import Order from "@/models/Order";
import { sendMail } from "@/lib/mailer";

const createOrderSchema = z.object({
    ticketId: z.string().min(1),
    quantity: z.number().int().min(1).optional().default(1),
}).strict();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        if (!session.user.profileComplete) {
            return NextResponse.json({ error: "Complete your profile before ordering" }, { status: 403 });
        }

        const parsed = createOrderSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();
        const { ticketId, quantity } = parsed.data;
        const ticket = await Ticket.findOne({ _id: ticketId, status: "active" });
        if (!ticket) {
            return NextResponse.json({ error: "Active ticket not found" }, { status: 404 });
        }
        if (!ticket.wise?.enabled || !ticket.wise.paymentLink) {
            return NextResponse.json({ error: "Wise payment is not available for this ticket" }, { status: 400 });
        }

        const remaining = Math.max(0, Number(ticket.quantity ?? 0) - Number(ticket.sold ?? 0));
        if (quantity > remaining) {
            return NextResponse.json({ error: `Only ${remaining} ticket(s) remaining` }, { status: 400 });
        }

        const paymentLink = ticket.wise.paymentLink;
        const depositInstructions = ticket.wise.depositInstructions ?? null;
        const order = await Order.create({
            userId: session.user.email,
            userEmail: session.user.email,
            items: [{
                ticketId: ticket._id,
                name: ticket.name,
                price: ticket.price,
                currency: ticket.currency ?? "USD",
                quantity,
            }],
            totalAmount: ticket.price * quantity,
            currency: ticket.currency ?? "USD",
            status: "pending",
            paymentDetails: {
                method: "wise",
                paymentLink,
                depositInstructions,
            },
        });

        try {
            const purchaserName = session.user.name ?? session.user.email.split("@")[0];
            await sendMail({
                to: session.user.email,
                subject: "Your order has been created",
                html: `
          <h1>Order Created</h1>
          <p>Thank you, ${purchaserName}, for ordering <strong>${ticket.name}</strong>.</p>
          <p>Status: <b>Pending</b></p>
          <p>Please complete your payment using the Wise link below:</p><p><a href="${paymentLink}">${paymentLink}</a></p>
          ${depositInstructions ? `<h4>Deposit Instructions</h4><div>${depositInstructions}</div>` : ""}
          <h4>Order summary</h4>
          <ul>
            <li>Order ID: ${order._id}</li>
            <li>Ticket: ${ticket.name}</li>
            <li>Quantity: ${quantity}</li>
            <li>Total: ${ticket.price * quantity}</li>
          </ul>
        `,
            });
        } catch (mailErr) {
            console.error("Order created but failed to send email:", mailErr);
        }

        return NextResponse.json({ order, paymentLink, depositInstructions });
    } catch (err) {
        console.error("Create order error:", err);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
