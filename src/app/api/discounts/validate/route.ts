// app/api/discounts/validate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongoose } from "@/lib/mongoose";
import Discount from "@/models/Discount";
import { Ticket } from "@/models/Ticket";

const schema = z.object({
    ticketId: z.string().min(1),
    code: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const { ticketId, code } = parsed.data;

        await connectMongoose();

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

        const discount = await Discount.findOne({ code: code.trim().toUpperCase(), active: true });
        if (!discount) return NextResponse.json({ error: "Invalid or inactive discount code" }, { status: 404 });

        if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Discount code expired" }, { status: 400 });
        }

        if (discount.maxUses !== null && discount.used >= discount.maxUses) {
            return NextResponse.json({ error: "Discount code usage limit reached" }, { status: 400 });
        }

        // if appliesTo set and not empty, ensure ticketId is included
        if (Array.isArray(discount.appliesTo) && discount.appliesTo.length > 0) {
            const applies = discount.appliesTo.map(String);
            if (!applies.includes(String(ticket._id))) {
                return NextResponse.json({ error: "Discount does not apply to this ticket" }, { status: 400 });
            }
        }

        // compute discounted price server-side (ticket.price assumed as decimal e.g. 100.00)
        const ticketPrice = Number(ticket.price);
        if (Number.isNaN(ticketPrice)) return NextResponse.json({ error: "Invalid ticket price" }, { status: 500 });

        let discounted = ticketPrice;
        if (discount.type === "fixed") {
            // discount.value is cents
            const fixedOff = Number(discount.value) / 100;
            discounted = Math.max(0, ticketPrice - fixedOff);
        } else if (discount.type === "percent") {
            const pct = Number(discount.value) / 100;
            discounted = Math.max(0, ticketPrice * (1 - pct));
        }

        // normalize (2 decimals)
        discounted = Number(discounted.toFixed(2));

        return NextResponse.json({
            code: discount.code,
            type: discount.type,
            value: discount.value,
            currency: discount.currency ?? "USD",
            originalPrice: ticketPrice,
            discountedPrice: discounted,
            discountId: String(discount._id),
        });
    } catch (err) {
        console.error("validate-discount error:", err);
        return NextResponse.json({ error: "Failed to validate discount" }, { status: 500 });
    }
}
