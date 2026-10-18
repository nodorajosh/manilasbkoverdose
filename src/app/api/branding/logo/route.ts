import { NextResponse } from "next/server";

import { getBrandingAssets } from "@/lib/branding-assets";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { logo } = await getBrandingAssets();

        if (!logo) {
            return NextResponse.json({ error: "Logo not found" }, { status: 404 });
        }

        return NextResponse.json(logo);
    } catch (error) {
        console.error("Logo fetch failed:", error);
        return NextResponse.json({ error: "Failed to fetch logo" }, { status: 500 });
    }
}
