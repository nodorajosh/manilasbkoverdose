import mongoose from "mongoose";

export const DEFAULT_PAGE_SIZE = 20;

export const cursorInput = {
    cursor: undefined as string | undefined,
    limit: DEFAULT_PAGE_SIZE,
};

export function parseCursor(cursor?: string) {
    if (!cursor) return null;
    if (!mongoose.Types.ObjectId.isValid(cursor)) return null;
    return new mongoose.Types.ObjectId(cursor);
}

export function paginateById<T>(
    docs: T[],
    limit: number,
    getId: (item: T) => string = (item) => String((item as { _id: unknown })._id)
): { items: T[]; nextCursor?: string } {
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const last = items[items.length - 1];
    return {
        items,
        nextCursor: hasMore && last ? getId(last) : undefined,
    };
}
