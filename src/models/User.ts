// models/User.ts
import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
    {
        name: { type: String },
        email: { type: String, required: true, unique: true, index: true },
        image: { type: String },
        role: { type: String, enum: ["user", "admin", "vendor"], default: "user", index: true },
        // store provider ids if needed (googleId, etc.) or let adapter handle it
    },
    { timestamps: true }
);

export default models.User || model("User", UserSchema);
