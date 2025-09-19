import { Schema, model, models } from "mongoose";

const OrderItemSchema = new Schema({
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    name: String,
    price: Number, // store price at time of purchase in cents (integer)
    currency: String,
    quantity: Number
});

const OrderSchema = new Schema({
    userId: { type: String, required: true }, // use email or user id
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true }, // cents
    currency: { type: String, required: true }, // ISO code
    status: { type: String, enum: ["pending", "paid", "failed", "cancelled"], default: "pending" },
    wise: {
        quoteId: String,
        transferId: Number, // Wise transfer ids are integers
        payInDetails: Schema.Types.Mixed // store whatever deposit details you get
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default models.Order || model("Order", OrderSchema);
