// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import UserModel from "@/models/User";

export type PublicUser = {
    _id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: "user" | "admin" | "vendor";
    profileComplete?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectMongoose();

        const users = await UserModel.find()
            .select("name firstName lastName email image role profileComplete createdAt updatedAt")
            .lean();

        const safeUsers: PublicUser[] = users.map((u: any) => ({
            _id: String(u._id),
            name: u.firstName ? `${u.firstName.trim()} ${u.lastName || ""}`.trim() : u.name ?? null,
            email: u.email,
            image: u.image ?? null,
            role: u.role ?? "user",
            profileComplete: Boolean(u.profileComplete ?? false),
            createdAt: u.createdAt?.toISOString?.() ?? null,
            updatedAt: u.updatedAt?.toISOString?.() ?? null,
        }));

        return NextResponse.json({ users: safeUsers });
    } catch (err) {
        console.error("GET /api/admin/users error:", err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
