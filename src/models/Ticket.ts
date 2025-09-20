// models/Ticket.ts
import { Schema, model, models } from "mongoose";

const WiseSchema = new Schema(
    {
        enabled: { type: Boolean, default: false },
        paymentLink: { type: String, default: null },
        depositInstructions: { type: String, default: null },
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
        // price stored as integer cents (e.g. 10000 = $100.00)
        price: { type: Number, required: true },
        currency: { type: String, required: true, default: "USD" },
        quantity: { type: Number, required: true },
        sold: { type: Number, default: 0 },
        metadata: { type: Schema.Types.Mixed },
        thumbnail: ThumbnailSchema,
        wise: WiseSchema,
        // status helps manage current vs archived tickets
        status: {
            type: String,
            enum: ["active", "archived", "draft"],
            default: "active",
        },
    },
    { timestamps: true }
);

export const Ticket = models.Ticket || model("Ticket", TicketSchema);
