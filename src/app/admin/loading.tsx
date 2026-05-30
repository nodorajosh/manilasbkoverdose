export default function AdminLoading() {
    return (
        <main className="min-h-dvh w-full flex flex-col items-center px-6 pt-36 pb-12 bg-black text-white">
            <div className="w-full max-w-6xl animate-pulse">
                {/* Header skeleton */}
                <div className="h-9 w-64 rounded-lg bg-gray-800 mx-auto mb-12" />

                {/* Tab bar skeleton */}
                <div className="flex gap-2 mb-8 border-b border-gray-800 pb-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 w-28 rounded-t-lg bg-gray-800" />
                    ))}
                </div>

                {/* Content skeleton */}
                <div className="space-y-6">
                    {/* Table header */}
                    <div className="flex gap-4 mb-4">
                        <div className="h-10 flex-1 rounded bg-gray-800" />
                        <div className="h-10 w-32 rounded bg-gray-800" />
                    </div>

                    {/* Table rows */}
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="h-12 flex-1 rounded bg-gray-800" />
                            <div className="h-12 w-24 rounded bg-gray-800" />
                            <div className="h-12 w-20 rounded bg-gray-800" />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
