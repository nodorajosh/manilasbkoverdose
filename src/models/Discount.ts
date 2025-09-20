// models/Discount.ts
import { Schema, model, models } from "mongoose";

const DiscountSchema = new Schema(
    {
        code: { type: String, required: true, unique: true, index: true },
        // 'fixed' means a fixed amount off in cents; 'percent' means a percentage (0-100)
        type: { type: String, enum: ["fixed", "percent"], required: true, default: "fixed" },
        // if type === 'fixed', value is integer cents (e.g. 1500 = $15.00). If 'percent', value is integer percent (e.g. 15 = 15%).
        value: { type: Number, required: true },
        currency: { type: String, default: "USD" }, // used when type === 'fixed'
        maxUses: { type: Number, default: null }, // null = unlimited
        used: { type: Number, default: 0 },
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: true },
        // optional: limit discount to specific tickets
        appliesTo: [{ type: Schema.Types.ObjectId, ref: "Ticket" }],
        metadata: { type: Schema.Types.Mixed },

        // NEW: who created this discount (references users collection)
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

export const Discount = models.Discount || model("Discount", DiscountSchema);
export default Discount;
