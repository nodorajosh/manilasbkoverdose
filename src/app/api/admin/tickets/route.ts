// app/api/admin/tickets/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";

const MAX_BYTES = 500 * 1024;

const createTicketSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().int().nonnegative(), // cents (frontend uses `price`)
    currency: z.string().min(3),
    quantity: z.number().int().nonnegative(),
    metadata: z.any().optional(),
    thumbnail: z
        .object({
            dataUrl: z.string(), // data:image/...;base64,...
            size: z.number().int().max(MAX_BYTES),
            mime: z.string(),
            width: z.number().int().optional(),
            height: z.number().int().optional(),
        })
        .optional(),
    wise: z
        .object({
            enabled: z.boolean(),
            paymentLink: z.string().url().nullable(),
            depositInstructions: z.string().max(2000).optional().nullable(),
        })
        .optional(),
    status: z.enum(["active", "archived", "draft"]).optional(),
    category: z.enum(["pass", "bootcamp"]),
});

const updateTicketSchema = z.object({
    ticketId: z.string().min(1),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().int().nonnegative().optional(), // cents
    currency: z.string().min(3).optional(),
    quantity: z.number().int().nonnegative().optional(),
    metadata: z.any().optional(),
    thumbnail: z
        .object({
            dataUrl: z.string(),
            size: z.number().int().max(MAX_BYTES),
            mime: z.string(),
            width: z.number().int().optional(),
            height: z.number().int().optional(),
        })
        .optional()
        .nullable(),
    wise: z
        .object({
            enabled: z.boolean().optional(),
            paymentLink: z.string().url().optional().nullable(),
            depositInstructions: z.string().max(2000).optional().nullable(),
        })
        .optional()
        .nullable(),
    status: z.enum(["active", "archived", "draft"]).optional(),
    category: z.enum(["pass", "bootcamp"]),
});

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectMongoose();

        const url = new URL(req.url);
        const status = url.searchParams.get("status") ?? "active";

        const filter: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (status && status !== "all") filter.status = status;

        const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ tickets });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Admin tickets GET failed:", err);
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
            console.log("create ticket validation failed:", parsed.error.flatten());
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();

        // thumbnail sanity
        if (parsed.data.thumbnail) {
            const { dataUrl, size } = parsed.data.thumbnail;
            if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(dataUrl)) {
                return NextResponse.json({ error: "Invalid image mime type" }, { status: 400 });
            }
            if (size > MAX_BYTES) {
                return NextResponse.json({ error: "Image too large" }, { status: 400 });
            }
        }

        const doc = await Ticket.create({
            name: parsed.data.name,
            description: parsed.data.description,
            price: parsed.data.price / 100,
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
            status: parsed.data.status ?? "active",
            category: parsed.data.category ?? "pass",
        });

        return NextResponse.json({ ticket: doc });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("create ticket error:", err);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = updateTicketSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();
        const { ticketId } = parsed.data;
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        if (parsed.data.name !== undefined) ticket.name = parsed.data.name;
        if (parsed.data.description !== undefined) ticket.description = parsed.data.description;
        if (parsed.data.price !== undefined) ticket.price = parsed.data.price / 100;
        if (parsed.data.currency !== undefined) ticket.currency = parsed.data.currency;
        if (parsed.data.quantity !== undefined) ticket.quantity = parsed.data.quantity;
        if (parsed.data.metadata !== undefined) ticket.metadata = parsed.data.metadata;
        if (parsed.data.thumbnail !== undefined) {
            ticket.thumbnail = parsed.data.thumbnail ?? undefined;
        }
        if (parsed.data.wise !== undefined) {
            ticket.wise = parsed.data.wise ?? { enabled: false };
        }
        if (parsed.data.status !== undefined) {
            ticket.status = parsed.data.status;
        }
        if (parsed.data.category !== undefined) {
            ticket.category = parsed.data.category;
        }

        await ticket.save();
        return NextResponse.json({ ticket });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("update ticket error:", err);
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { ticketId, hard } = body as { ticketId?: string; hard?: boolean };

        if (!ticketId) {
            return NextResponse.json({ error: "ticketId required" }, { status: 400 });
        }

        await connectMongoose();

        if (hard) {
            const res = await Ticket.findByIdAndDelete(ticketId);
            if (!res) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
            return NextResponse.json({ success: true });
        } else {
            const ticket = await Ticket.findById(ticketId);
            if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
            ticket.status = "archived";
            await ticket.save();
            return NextResponse.json({ ticket });
        }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("delete ticket error:", err);
        return NextResponse.json({ error: "Failed to delete/archive ticket" }, { status: 500 });
    }
}
