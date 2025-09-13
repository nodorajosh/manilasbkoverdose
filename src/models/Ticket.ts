import mongoose, { Schema, model, models } from "mongoose";

const TicketSchema = new Schema(
    {
        eventId: { type: Schema.Types.ObjectId, ref: "Event", required: false }, // optional for now
        name: { type: String, required: true },
        price: { type: Number, required: true },
        currency: { type: String, required: true, default: "USD" },
        quantity: { type: Number, required: true },
        sold: { type: Number, required: true, default: 0 },
        metadata: { type: Object },
    },
    { timestamps: true }
);

export const Ticket = models.Ticket || model("Ticket", TicketSchema);
