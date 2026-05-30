export default function UserLoading() {
    return (
        <main className="min-h-dvh px-6 pt-36 pb-12 bg-black text-white">
            <div className="mx-auto max-w-2xl animate-pulse">
                {/* Header skeleton */}
                <div className="h-9 w-48 rounded-lg bg-gray-800 mx-auto mb-10" />

                {/* Tab bar skeleton */}
                <div className="flex gap-2 mb-8 border-b border-gray-800 pb-2">
                    <div className="h-10 w-32 rounded-t-lg bg-gray-800" />
                    <div className="h-10 w-32 rounded-t-lg bg-gray-800" />
                </div>

                {/* Form fields skeleton */}
                <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 w-24 rounded bg-gray-800" />
                            <div className="h-12 w-full rounded bg-gray-800" />
                        </div>
                    ))}
                    <div className="h-12 w-40 rounded-full bg-gray-800 mt-4" />
                </div>
            </div>
        </main>
    );
}
