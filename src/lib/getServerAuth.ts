// lib/getServerAuth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";

export async function getServerAuth() {
    // In App Router server components / server actions, use:
    const session = await getServerSession(authOptions);
    return session;
}
