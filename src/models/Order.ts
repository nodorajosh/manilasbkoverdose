import { Schema, model, models } from "mongoose";

const OrderItemSchema = new Schema({
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    name: String,
    price: Number,
    currency: String,
    quantity: Number,
});

const PaypalCaptureSchema = new Schema(
    {
        id: { type: String, required: true },
        amount: Schema.Types.Mixed,
    },
    { _id: false }
);

const PaymentDetailsSchema = new Schema(
    {
        method: String,
        paymentLink: { type: String, default: null },
        depositInstructions: { type: String, default: null },
        paypalOrderId: { type: String, default: null },
        referenceId: { type: String, default: null },
        paypalCapture: { type: [PaypalCaptureSchema], default: [] },
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
        userEmail: String,
        items: [OrderItemSchema],
        totalAmount: { type: Number, required: true },
        currency: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "paid", "failed", "cancelled", "refunded", "fulfilled"],
            default: "pending",
        },
        paymentDetails: PaymentDetailsSchema,
        wise: WiseMetaSchema,
        metadata: Schema.Types.Mixed,
        paymentConfirmedAt: Date,
        cancelledAt: Date,
    },
    { timestamps: true }
);

export default models.Order || model("Order", OrderSchema);
