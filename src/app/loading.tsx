export default function Loading() {
    return (
        <main className="min-h-screen pt-32 pb-16 px-6">
            <div className="mx-auto max-w-5xl animate-pulse">
                {/* Hero skeleton */}
                <div className="mb-16 space-y-6">
                    <div className="h-10 w-2/3 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-6 w-1/2 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-6 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>

                {/* Content cards skeleton */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-gray-200/20 bg-gray-100/50 p-6 dark:bg-gray-900/50"
                        >
                            <div className="mb-4 h-48 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
                            <div className="space-y-3">
                                <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
                                <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom section skeleton */}
                <div className="mt-16 space-y-4">
                    <div className="h-8 w-1/3 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-5/6 rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-4/6 rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>
            </div>
        </main>
    );
}
