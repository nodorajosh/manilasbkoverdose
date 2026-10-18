import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

type CloudinaryResource = {
    public_id: string;
    secure_url?: string;
    width?: number;
    height?: number;
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const year = searchParams.get("year");
    const category = searchParams.get("category");

    if (!year || !category || !/^\d{4}$/.test(year) || !/^[\w -]+$/.test(category)) {
        return NextResponse.json(
            { error: "Invalid year or category" },
            { status: 400 }
        );
    }

    const folder = `mnl-sbkz/artists/${year}/${category}`;

    try {
        const result = await cloudinary.api.resources_by_asset_folder(folder, {
            prefix: ""
        });

        const images = (result.resources as CloudinaryResource[])
            .filter((resource) => resource.secure_url)
            .map((resource) => ({
                public_id: resource.public_id,
                url: resource.secure_url as string,
                width: resource.width ?? 0,
                height: resource.height ?? 0,
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