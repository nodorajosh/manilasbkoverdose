import mongoose, { Schema, model, models } from "mongoose";

const CartSchema = new Schema(
    {
        userId: { type: String, required: true, unique: true },
        items: [
            {
                ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
                quantity: { type: Number, default: 1 },
            },
        ],
    },
    { timestamps: true }
);

const Cart = models.Cart || model("Cart", CartSchema);
export default Cart;
