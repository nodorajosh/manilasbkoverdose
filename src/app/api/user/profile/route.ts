// app/api/user/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import User from "@/models/User";

const updateSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(4),
    dateOfBirth: z.string().min(4), // iso string date
    address: z.object({
        line1: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        zip: z.string().min(1),
        country: z.string().min(2),
    }),
    image: z.string().optional().nullable(),
});

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        await connectMongoose();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Do not return sensitive fields — return required profile and flags
        const payload = {
            _id: (user as any)._id, //eslint-disable-line @typescript-eslint/no-explicit-any
            email: user.email,
            image: user.image ?? null,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            phone: user.phone ?? null,
            dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
            address: user.address ?? null,
            profileComplete: user.profileComplete ?? false,
            role: user.role ?? "user",
        };
        return NextResponse.json({ user: payload });
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("GET /api/user/profile error:", err);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        await connectMongoose();

        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // update fields
        user.firstName = parsed.data.firstName;
        user.lastName = parsed.data.lastName;
        user.phone = parsed.data.phone;
        user.dateOfBirth = new Date(parsed.data.dateOfBirth);
        user.address = parsed.data.address;
        if (parsed.data.image) user.image = parsed.data.image;

        // compute profileComplete — all required fields must be present
        user.profileComplete =
            Boolean(user.firstName) &&
            Boolean(user.lastName) &&
            Boolean(user.phone) &&
            Boolean(user.dateOfBirth) &&
            Boolean(user.address?.line1 && user.address?.city && user.address?.country && user.address?.zip);

        await user.save();

        const payload = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth.toISOString(),
            address: user.address,
            profileComplete: user.profileComplete,
            image: user.image ?? null,
            role: user.role,
        };

        return NextResponse.json({ user: payload });
    } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("PATCH /api/user/profile error:", err);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}