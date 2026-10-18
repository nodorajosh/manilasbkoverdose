import cloudinary from "@/lib/cloudinary";

export type BrandingAsset = {
    public_id: string;
    url: string;
    resource_type: "image" | "video" | string;
    width: number;
    height: number;
};

export type BrandingAssets = {
    year: string | null;
    logo: BrandingAsset | null;
    hero: BrandingAsset | null;
    trailer: BrandingAsset | null;
};

type CloudinaryFolder = {
    name: string;
    path: string;
};

type CloudinaryResource = {
    public_id: string;
    secure_url?: string;
    resource_type?: string;
    width?: number;
    height?: number;
};

async function getLatestBrandingYear() {
    const result = await cloudinary.api.sub_folders("mnl-sbkz/branding");
    const years = (result.folders as CloudinaryFolder[] | undefined ?? [])
        .filter((folder) => /^\d{4}$/.test(folder.name))
        .sort((a, b) => Number(b.name) - Number(a.name));

    return years[0] ?? null;
}

async function getAsset(folder: string): Promise<BrandingAsset | null> {
    const result = await cloudinary.api.resources_by_asset_folder(folder, { prefix: "" });
    const resource = (result.resources as CloudinaryResource[])
        .filter((item) => item.secure_url)
        .sort((a, b) => a.public_id.localeCompare(b.public_id))[0];

    if (!resource?.secure_url) return null;

    return {
        public_id: resource.public_id,
        url: resource.secure_url,
        resource_type: resource.resource_type ?? "image",
        width: resource.width ?? 0,
        height: resource.height ?? 0,
    };
}

export async function getBrandingAssets(): Promise<BrandingAssets> {
    const yearFolder = await getLatestBrandingYear();
    const base = yearFolder?.path ?? "mnl-sbkz/branding";
    const [logo, hero, trailer] = await Promise.all([
        getAsset(`${base}/logo`).catch(() => null),
        getAsset(`${base}/hero`).catch(() => null),
        getAsset(`${base}/trailer`).catch(() => null),
    ]);

    return {
        year: yearFolder?.name ?? null,
        logo,
        hero,
        trailer,
    };
}
