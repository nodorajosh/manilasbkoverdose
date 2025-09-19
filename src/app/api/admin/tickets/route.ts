// app/api/admin/tickets/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";

const createTicketSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    priceCents: z.number().int().nonnegative(),
    currency: z.string().min(3),
    quantity: z.number().int().nonnegative(),
    metadata: z.any().optional(),
    thumbnail: z
        .object({
            dataUrl: z.string(), // data:image/...;base64,...
            size: z.number().int().max(500 * 1024), // <= 500KB
            mime: z.string(),
            width: z.number().int().optional(),
            height: z.number().int().optional(),
        })
        .optional(),
    wise: z
        .object({
            enabled: z.boolean().optional(),
            paymentLink: z.string().url().optional().nullable(),
            depositInstructions: z.string().max(2000).optional().nullable(),
        })
        .optional(),
});

export async function GET() {
    try {
        await connectMongoose();
        const tickets = await Ticket.find().lean();
        return NextResponse.json({ tickets });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = createTicketSchema.safeParse(body);
        if (!parsed.success) {
            console.log("create ticket validation status:", parsed);
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();

        // server-side thumbnail checks
        if (parsed.data.thumbnail) {
            const { dataUrl, size } = parsed.data.thumbnail;
            if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(dataUrl)) {
                return NextResponse.json({ error: "Invalid image mime type" }, { status: 400 });
            }
            if (size > 500 * 1024) {
                return NextResponse.json({ error: "Image too large" }, { status: 400 });
            }
        }

        // create ticket
        const doc = await Ticket.create({
            name: parsed.data.name,
            description: parsed.data.description,
            price: parsed.data.priceCents / 100,
            currency: parsed.data.currency,
            quantity: parsed.data.quantity,
            metadata: parsed.data.metadata,
            thumbnail: parsed.data.thumbnail
                ? {
                    dataUrl: parsed.data.thumbnail.dataUrl,
                    size: parsed.data.thumbnail.size,
                    mime: parsed.data.thumbnail.mime,
                    width: parsed.data.thumbnail.width,
                    height: parsed.data.thumbnail.height,
                }
                : undefined,
            wise: parsed.data.wise
                ? {
                    enabled: parsed.data.wise.enabled ?? false,
                    paymentLink: parsed.data.wise.paymentLink ?? null,
                    depositInstructions: parsed.data.wise.depositInstructions ?? null,
                }
                : { enabled: false },
        });

        return NextResponse.json({ ticket: doc });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("create ticket error:", err);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}
