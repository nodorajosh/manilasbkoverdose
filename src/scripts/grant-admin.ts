// scripts/grant-admin.ts
import mongoose from "mongoose";
import User from "../models/User";

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error("MONGODB_URI required");

async function run() {
    await mongoose.connect(uri);
    const email = process.argv[2];
    if (!email) {
        console.error("Usage: node ./scripts/grant-admin.js user@example.com");
        process.exit(1);
    }
    const u = await User.findOneAndUpdate({ email }, { role: "admin" }, { upsert: false, new: true });
    console.log("Updated user:", u);
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
