export type CloudinaryImage = {
    public_id: string;
    url: string;
    width: number;
    height: number;
};

export async function fetchArtistImages(
    year: string,
    category: string
): Promise<CloudinaryImage[]> {
    const res = await fetch(
        `/api/artists?year=${encodeURIComponent(
            year
        )}&category=${encodeURIComponent(category)}`
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.images ?? [];
}