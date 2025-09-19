// models/Ticket.ts
import { Schema, model, models } from "mongoose";

const WiseSchema = new Schema(
    {
        enabled: { type: Boolean, default: false },
        paymentLink: { type: String, default: null }, // e.g. a Wise deposit/payment URL (if you use one)
        depositInstructions: { type: String, default: null }, // optional human-readable instructions
    },
    { _id: false }
);

const ThumbnailSchema = new Schema(
    {
        dataUrl: String,
        size: Number,
        mime: String,
        width: Number,
        height: Number,
    },
    { _id: false }
);

const TicketSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true }, // cents
        currency: { type: String, required: true, default: "USD" },
        quantity: { type: Number, required: true },
        sold: { type: Number, default: 0 },
        metadata: { type: Schema.Types.Mixed },
        thumbnail: ThumbnailSchema,
        wise: WiseSchema,
    },
    { timestamps: true }
);

export const Ticket = models.Ticket || model("Ticket", TicketSchema);
