"use client";

import type { RefObject } from "react";
import Spinner from "@/components/spinner";

export function LoadMoreSentinel({
    sentinelRef,
    isFetchingNextPage,
    hasNextPage,
}: {
    sentinelRef: RefObject<HTMLDivElement | null>;
    isFetchingNextPage: boolean;
    hasNextPage: boolean | undefined;
}) {
    return (
        <div ref={sentinelRef} className="py-4 flex justify-center min-h-[2rem]">
            {isFetchingNextPage && (
                <span className="flex items-center gap-2 text-sm text-gray-400">
                    <Spinner />
                    Loading more…
                </span>
            )}
            {!hasNextPage && !isFetchingNextPage && (
                <span className="text-xs text-gray-500">End of list</span>
            )}
        </div>
    );
}
