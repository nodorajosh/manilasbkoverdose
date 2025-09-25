// models/User.ts
import { Schema, model, models } from "mongoose";

const AddressSchema = new Schema(
    {
        line1: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true },
    },
    { _id: false }
);

const UserSchema = new Schema(
    {
        name: { type: String }, // full name optional (we keep first/last below)
        email: { type: String, required: true, unique: true, index: true },
        image: { type: String }, // optional
        role: { type: String, enum: ["user", "admin", "vendor"], default: "user", index: true },

        // Profile fields (required for purchases) — everything required except `image`
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        address: { type: AddressSchema, required: true },

        // convenience fields
        provider: { type: String }, // e.g. 'google' | 'email' (not enforced)
        providerId: { type: String }, // optional provider id

        // Flag: set true when user has filled required profile fields
        profileComplete: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

// If model already exists (hot reload), reuse it
export default (models.User as any) || model("User", UserSchema); //eslint-disable-line @typescript-eslint/no-explicit-any
