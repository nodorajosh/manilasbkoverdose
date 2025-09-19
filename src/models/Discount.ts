// models/Discount.ts
import { Schema, model, models } from "mongoose";

const DiscountSchema = new Schema(
    {
        code: { type: String, required: true, unique: true },
        type: { type: String, enum: ["percentage", "fixed"], required: true },
        amount: { type: Number, required: true }, // if fixed => cents; if percentage => integer (e.g., 10 = 10%)
        currency: { type: String, default: "USD" },
        expiresAt: { type: Date, required: false },
        usageLimit: { type: Number, required: false }, // total times it can be used
        usedCount: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
        createdBy: { type: String }, // admin userId/email
    },
    { timestamps: true }
);

export default models.Discount || model("Discount", DiscountSchema);
