import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { isMainArtistsCategory, lineupSlot, sortArtistImages, type LineupImage } from "@/lib/artist-lineup";

type CloudinaryResource = LineupImage & {
    asset_id?: string;
    secure_url?: string;
    url?: string;
    width?: number;
    height?: number;
    resource_type?: string;
    format?: string;
};

type CloudinaryFolder = {
    name: string;
    path: string;
};

const ARTISTS_ROOT = "mnl-sbkz/artists";
const PAGE_SIZE = 500;
const MAX_PAGES = 10;

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

    const folder = `${ARTISTS_ROOT}/${year}/${category}`;

    try {
        const resources = await listCategoryResources(folder, year, category);
        const images = sortArtistImages(
            resources.flatMap((resource) => {
                const image = toArtistImage(resource);
                return image ? [image] : [];
            }),
            year,
            category
        ).map(({ public_id, url, width, height, created_at }) => ({
            public_id,
            url,
            width,
            height,
            created_at,
        }));

        return NextResponse.json({ images });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to fetch images" },
            { status: 500 }
        );
    }
}

async function listCategoryResources(folder: string, year: string, category: string): Promise<CloudinaryResource[]> {
    const direct = await listAssetFolder(folder);
    if (!isMainArtistsCategory(category) || hasLineupSlot(direct, year, 1)) {
        return direct;
    }

    const nested = await listSlottedSubfolderAssets(folder, year);
    const merged = dedupeResources([...direct, ...nested]);
    if (hasLineupSlot(merged, year, 1)) return merged;

    const discovered = await findLineupAsset(year);
    return dedupeResources([...merged, ...discovered]);
}

function hasLineupSlot(resources: CloudinaryResource[], year: string, slot: number): boolean {
    return resources.some((resource) => lineupSlot(namesFor(resource), year) === slot);
}

function namesFor(resource: CloudinaryResource): string[] {
    return [
        resource.display_name,
        resource.filename,
        resource.original_filename,
        ...(resource.sort_names ?? []),
        resource.public_id,
    ].filter((name): name is string => Boolean(name));
}

async function listAssetFolder(folder: string): Promise<CloudinaryResource[]> {
    const resources: CloudinaryResource[] = [];
    let nextCursor: string | undefined;

    for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await cloudinary.api.resources_by_asset_folder(folder, {
            max_results: PAGE_SIZE,
            ...(nextCursor ? { next_cursor: nextCursor } : {}),
        });

        resources.push(...((result.resources ?? []) as CloudinaryResource[]));
        nextCursor = typeof result.next_cursor === "string" ? result.next_cursor : undefined;
        if (!nextCursor) break;
    }

    return resources;
}

async function listSlottedSubfolderAssets(folder: string, year: string): Promise<CloudinaryResource[]> {
    let folders: CloudinaryFolder[] = [];

    try {
        const result = await cloudinary.api.sub_folders(folder, { max_results: PAGE_SIZE });
        folders = (result.folders ?? []) as CloudinaryFolder[];
    } catch (error) {
        console.error("Cloudinary subfolder lookup failed:", error);
        return [];
    }

    const nested = await Promise.all(folders.map(async (subfolder) => {
        try {
            const assets = await listAssetFolder(subfolder.path);
            return assets
                .map((asset) => ({ ...asset, sort_names: [...(asset.sort_names ?? []), subfolder.name] }))
                .filter((asset) => lineupSlot(namesFor(asset), year) != null);
        } catch (error) {
            console.error("Cloudinary subfolder asset lookup failed:", error);
            return [];
        }
    }));

    return nested.flat();
}

async function findLineupAsset(year: string): Promise<CloudinaryResource[]> {
    const root = `${ARTISTS_ROOT}/${year}`;
    const expression = [
        `(asset_folder:"${root}" OR asset_folder:"${root}/*" OR public_id:${root}*)`,
        `(display_name="${year}_1" OR filename=${year}_1 OR filename:${year}_1*)`,
    ].join(" AND ");

    try {
        const result = await cloudinary.search.expression(expression).max_results(30).execute();
        return ((result.resources ?? []) as CloudinaryResource[]).filter((resource) => lineupSlot(namesFor(resource), year) === 1);
    } catch (error) {
        console.error("Cloudinary lineup search failed:", error);
        return [];
    }
}

function dedupeResources(resources: CloudinaryResource[]): CloudinaryResource[] {
    const byKey = new Map<string, CloudinaryResource>();

    for (const resource of resources) {
        const key = resource.asset_id || resource.public_id;
        if (!key) continue;

        const existing = byKey.get(key);
        if (!existing) {
            byKey.set(key, resource);
            continue;
        }

        byKey.set(key, {
            ...existing,
            secure_url: existing.secure_url || resource.secure_url,
            url: existing.url || resource.url,
            display_name: existing.display_name || resource.display_name,
            filename: existing.filename || resource.filename,
            original_filename: existing.original_filename || resource.original_filename,
            sort_names: [...(existing.sort_names ?? []), ...(resource.sort_names ?? [])],
            width: existing.width || resource.width,
            height: existing.height || resource.height,
            created_at: existing.created_at || resource.created_at,
            format: existing.format || resource.format,
            resource_type: existing.resource_type || resource.resource_type,
        });
    }

    return [...byKey.values()];
}

function toArtistImage(resource: CloudinaryResource) {
    const url = deliveryUrl(resource);
    if (!resource.public_id || !url) return null;

    return {
        public_id: resource.public_id,
        url,
        width: resource.width ?? 0,
        height: resource.height ?? 0,
        created_at: resource.created_at ?? "",
        display_name: resource.display_name,
        filename: resource.filename,
        original_filename: resource.original_filename,
        sort_names: resource.sort_names,
    };
}

function deliveryUrl(resource: CloudinaryResource): string | null {
    if (resource.secure_url) return resource.secure_url;
    if (resource.url) return resource.url.replace(/^http:\/\//i, "https://");
    if (!resource.public_id || !process.env.CLOUDINARY_CLOUD_NAME) return null;

    return cloudinary.url(resource.public_id, {
        secure: true,
        resource_type: resource.resource_type || "image",
        ...(resource.format ? { format: resource.format } : {}),
    });
}