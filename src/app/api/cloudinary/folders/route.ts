import { NextRequest, NextResponse } from "next/server";

import cloudinary from "@/lib/cloudinary";

type CloudinaryFolder = {
    name: string;
    path: string;
};

type ArtistYear = CloudinaryFolder & {
    categories: CloudinaryFolder[];
};

async function getSubfolders(path: string): Promise<CloudinaryFolder[]> {
    const result = await cloudinary.api.sub_folders(path);
    return ((result.folders ?? []) as CloudinaryFolder[]).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
    );
}

export async function GET(req: NextRequest) {
    const root = new URL(req.url).searchParams.get("root");

    if (root !== "artists" && root !== "branding") {
        return NextResponse.json({ error: "Invalid folder root" }, { status: 400 });
    }

    try {
        const rootPath = `mnl-sbkz/${root}`;
        const folders = await getSubfolders(rootPath);

        if (root === "branding") {
            return NextResponse.json({ root, folders });
        }

        const years = await Promise.all(
            folders.map(async (year): Promise<ArtistYear> => ({
                ...year,
                categories: await getSubfolders(year.path),
            }))
        );

        return NextResponse.json({ root, years });
    } catch (error) {
        console.error("Cloudinary folder fetch failed:", error);
        return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
    }
}
