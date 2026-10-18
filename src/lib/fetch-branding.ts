import type { BrandingAssets } from "./branding-assets";

export async function fetchBrandingAssets(): Promise<BrandingAssets | null> {
    const response = await fetch("/api/branding/assets", { cache: "no-store" });

    if (!response.ok) return null;

    return response.json() as Promise<BrandingAssets>;
}
