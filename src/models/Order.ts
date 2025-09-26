// models/Order.ts
import { Schema, model, models } from "mongoose";

const OrderItemSchema = new Schema({
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    name: String,
    price: Number, // store price at time of purchase (same unit you use in Ticket.price)
    currency: String,
    quantity: Number,
});

const PaymentDetailsSchema = new Schema(
    {
        method: { type: String }, // e.g. 'wise', 'stripe', etc.
        paymentLink: { type: String, default: null },
        depositInstructions: { type: String, default: null },
        // you can add more fields here later (e.g. payinReference)
    },
    { _id: false }
);

const WiseMetaSchema = new Schema(
    {
        quoteId: String,
        transferId: Schema.Types.Mixed,
        payInDetails: Schema.Types.Mixed,
    },
    { _id: false }
);

const OrderSchema = new Schema(
    {
        userId: { type: String, required: true },
        userEmail: { type: String, required: false },
        items: [OrderItemSchema],
        totalAmount: { type: Number, required: true },
        currency: { type: String, required: true },
        status: { type: String, enum: ["pending", "paid", "failed", "cancelled"], default: "pending" },
        paymentDetails: PaymentDetailsSchema,
        wise: WiseMetaSchema,
    },
    { timestamps: true }
);

export default models.Order || model("Order", OrderSchema);
