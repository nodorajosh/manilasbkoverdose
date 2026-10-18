import { NextResponse } from "next/server";

import { getBrandingAssets } from "@/lib/branding-assets";

export async function GET() {
    try {
        return NextResponse.json(await getBrandingAssets());
    } catch (error) {
        console.error("Branding assets fetch failed:", error);
        return NextResponse.json({ error: "Failed to fetch branding assets" }, { status: 500 });
    }
}
