// lib/mongoose.ts
import mongoose from "mongoose";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI required");
const uri = process.env.MONGODB_URI;

const cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = (global as any).__mongoose_cache || { conn: null, promise: null }; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function connectMongoose() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, { maxPoolSize: 10 });
    }
    cached.conn = await cached.promise;
    (global as any).__mongoose_cache = cached; // eslint-disable-line @typescript-eslint/no-explicit-any
    return cached.conn;
}
