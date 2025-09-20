// app/api/admin/discounts/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Discount from "@/models/Discount";
import User from "@/models/User"; // <<< ensure you have this model

const createSchema = z.object({
    code: z.string().min(1),
    type: z.enum(["fixed", "percent"]).default("fixed"),
    value: z.number().int().nonnegative(), // cents if fixed, percent (0-100) if percent
    currency: z.string().min(3).optional(),
    maxUses: z.number().int().nonnegative().optional().nullable(),
    expiresAt: z.string().optional().nullable(), // ISO date string (server will parse)
    active: z.boolean().optional(),
    appliesTo: z.array(z.string()).optional(),
    metadata: z.any().optional(),
});

const updateSchema = z.object({
    discountId: z.string().min(1),
    code: z.string().min(1).optional(),
    type: z.enum(["fixed", "percent"]).optional(),
    value: z.number().int().nonnegative().optional(),
    currency: z.string().min(3).optional().nullable(),
    maxUses: z.number().int().nonnegative().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    active: z.boolean().optional(),
    appliesTo: z.array(z.string()).optional().nullable(),
    metadata: z.any().optional().nullable(),
});

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectMongoose();

        const url = new URL(req.url);
        const status = url.searchParams.get("status") ?? "active"; // active | archived/all
        const filter: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (status === "active") filter.active = true;
        else if (status === "archived") filter.active = false;

        // populate createdBy for admin convenience
        const discounts = await Discount.find(filter).sort({ createdAt: -1 }).populate("createdBy", "name email").lean();
        return NextResponse.json({ discounts });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Admin discounts GET failed:", err);
        return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();

        // find the creator user (we want the ObjectId)
        const creatorEmail = session.user?.email;
        if (!creatorEmail) {
            return NextResponse.json({ error: "Creator email not available" }, { status: 400 });
        }

        const creator = await User.findOne({ email: creatorEmail });
        if (!creator || !creator._id) {
            // It's safest to require a matching user document so createdBy is a valid ObjectId ref.
            return NextResponse.json({ error: "Creator user not found in DB" }, { status: 400 });
        }

        const payload: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
            code: parsed.data.code.trim().toUpperCase(),
            type: parsed.data.type,
            value: parsed.data.value,
            currency: parsed.data.currency ?? "USD",
            maxUses: parsed.data.maxUses ?? null,
            active: parsed.data.active ?? true,
            metadata: parsed.data.metadata ?? {},
            createdBy: creator._id, // <-- set createdBy to objectId of creator
        };

        if (parsed.data.expiresAt) {
            const d = new Date(parsed.data.expiresAt);
            if (isNaN(d.getTime())) {
                return NextResponse.json({ error: "Invalid expiresAt date" }, { status: 400 });
            }
            payload.expiresAt = d;
        } else {
            payload.expiresAt = null;
        }

        if (parsed.data.appliesTo) payload.appliesTo = parsed.data.appliesTo;

        const exists = await Discount.findOne({ code: payload.code });
        if (exists) {
            return NextResponse.json({ error: "Discount code already exists" }, { status: 409 });
        }

        const doc = await Discount.create(payload);

        // populate createdBy before returning
        const populated = await doc.populate("createdBy", "name email");
        return NextResponse.json({ discount: populated });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Admin discounts POST failed:", err);
        return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();

        const { discountId } = parsed.data;
        const discount = await Discount.findById(discountId);
        if (!discount) {
            return NextResponse.json({ error: "Discount not found" }, { status: 404 });
        }

        if (parsed.data.code !== undefined) discount.code = parsed.data.code.trim().toUpperCase();
        if (parsed.data.type !== undefined) discount.type = parsed.data.type;
        if (parsed.data.value !== undefined) discount.value = parsed.data.value;
        if (parsed.data.currency !== undefined) discount.currency = parsed.data.currency ?? "USD";
        if (parsed.data.maxUses !== undefined) discount.maxUses = parsed.data.maxUses ?? null;
        if (parsed.data.expiresAt !== undefined) {
            discount.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
        }
        if (parsed.data.active !== undefined) discount.active = parsed.data.active;
        if (parsed.data.appliesTo !== undefined) discount.appliesTo = parsed.data.appliesTo ?? [];
        if (parsed.data.metadata !== undefined) discount.metadata = parsed.data.metadata ?? {};

        await discount.save();

        const populated = await discount.populate("createdBy", "name email");
        return NextResponse.json({ discount: populated });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Admin discounts PATCH failed:", err);
        return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { discountId, hard } = body as { discountId?: string; hard?: boolean };

        if (!discountId) return NextResponse.json({ error: "discountId required" }, { status: 400 });

        await connectMongoose();

        if (hard) {
            const res = await Discount.findByIdAndDelete(discountId);
            if (!res) return NextResponse.json({ error: "Discount not found" }, { status: 404 });
            return NextResponse.json({ success: true });
        } else {
            const discount = await Discount.findById(discountId);
            if (!discount) return NextResponse.json({ error: "Discount not found" }, { status: 404 });
            discount.active = false;
            await discount.save();
            const populated = await discount.populate("createdBy", "name email");
            return NextResponse.json({ discount: populated });
        }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Admin discounts DELETE failed:", err);
        return NextResponse.json({ error: "Failed to delete/archive discount" }, { status: 500 });
    }
}
