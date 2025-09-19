// app/api/admin/discounts/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Discount from "@/models/Discount";

const createDiscountSchema = z.object({
    code: z.string().min(3).max(64),
    type: z.enum(["percent", "fixed"]),
    value: z.number().nonnegative(),
    currency: z.string().optional(),
    usageLimit: z.number().int().optional().nullable(),
    expiresAt: z.string().optional().nullable(), // ISO date string
});

export async function GET() {
    try {
        await connectMongoose();
        const discounts = await Discount.find().lean();
        return NextResponse.json({ discounts });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(err);
        return NextResponse.json({ error: "Failed to list discounts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = createDiscountSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();

        const existing = await Discount.findOne({ code: parsed.data.code });
        if (existing) {
            return NextResponse.json({ error: "Code already exists" }, { status: 400 });
        }

        const doc = await Discount.create({
            code: parsed.data.code.toUpperCase(),
            type: parsed.data.type,
            value: parsed.data.value,
            currency: parsed.data.currency ?? "USD",
            usageLimit: parsed.data.usageLimit ?? null,
            expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        });

        return NextResponse.json({ discount: doc });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("create discount error:", err);
        return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
    }
}
