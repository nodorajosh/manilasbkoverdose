import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const year = searchParams.get("year");
    const category = searchParams.get("category");

    if (!year || !category) {
        return NextResponse.json(
            { error: "Missing year or category" },
            { status: 400 }
        );
    }

    const prefix = `mnl-sbkz/artists/${year}/${category}/`;

    try {
        // console.log(await cloudinary.api.sub_folders("mnl-sbkz/artists/2026"))
        const result = await cloudinary.api.resources_by_asset_folder(prefix, {
            prefix: ""
        });

        const images = result.resources.map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            public_id: r.public_id,
            url: r.secure_url,
            width: r.width,
            height: r.height,
        }));

        images.sort((a, b) => a.public_id.localeCompare(b.public_id));

        return NextResponse.json({ images });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to fetch images" },
            { status: 500 }
        );
    }
}