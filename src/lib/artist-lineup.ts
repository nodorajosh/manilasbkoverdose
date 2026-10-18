export type LineupImage = {
    public_id: string;
    created_at?: string;
    display_name?: string;
    filename?: string;
    original_filename?: string;
    sort_names?: string[];
};

const YEAR_SLOT = /^(\d{4})[-_](\d+)$/;

export function assetStem(value: string | null | undefined): string {
    if (!value) return "";

    const base = value.split(/[/\\]/).pop() ?? value;
    return base.replace(/\.[^.]+$/, "").trim();
}

export function isMainArtistsCategory(category: string): boolean {
    const normalized = category.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    return normalized === "main artists";
}

export function candidateNames(image: LineupImage): string[] {
    return [
        image.display_name,
        image.filename,
        image.original_filename,
        ...(image.sort_names ?? []),
        image.public_id,
    ].filter((name): name is string => Boolean(name));
}

// Cloudinary lineup files are named `{year}_{position}`, e.g. 2027_1.
export function lineupSlot(names: Array<string | null | undefined>, year: string): number | null {
    for (const name of names) {
        const match = assetStem(name).match(YEAR_SLOT);
        if (!match || match[1] !== year) continue;

        const slot = Number(match[2]);
        if (Number.isSafeInteger(slot)) return slot;
    }

    return null;
}

export function sortArtistImages<T extends LineupImage>(images: T[], year: string, category: string): T[] {
    const orderByLineupSlot = isMainArtistsCategory(category);

    return [...images].sort((a, b) => {
        if (orderByLineupSlot) {
            const aSlot = lineupSlot(candidateNames(a), year);
            const bSlot = lineupSlot(candidateNames(b), year);

            if (aSlot != null && bSlot != null && aSlot !== bSlot) return aSlot - bSlot;
            if (aSlot != null && bSlot == null) return -1;
            if (aSlot == null && bSlot != null) return 1;
        }

        const createdAtComparison = (a.created_at ?? "").localeCompare(b.created_at ?? "");
        if (createdAtComparison !== 0) return createdAtComparison;

        return a.public_id.localeCompare(b.public_id, undefined, { numeric: true });
    });
}
