import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Cart from "@/models/Cart";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

type CartItem = {
    ticketName: string;
    ticketPrice: number;
    ticketCurrency: string;
    ticketId: string;
    quantity: number;
};

// 🛒 GET - Fetch the logged-in user's cart
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const cart = await Cart.findOne({ userId: session.user.email });

        if (!cart) {
            return NextResponse.json({ items: [] });
        }

        return NextResponse.json(cart);
    } catch (error) {
        console.error("Cart fetch failed:", error);
        return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
    }
}


// 🛒 POST - Add or update items in the cart
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const { ticketName, ticketPrice, ticketCurrency, ticketId, quantity = 1 } = body;

        if (!ticketId) {
            return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
        }

        // Ensure valid ObjectId
        let objectId: mongoose.Types.ObjectId;
        try {
            objectId = new mongoose.Types.ObjectId(ticketId);
        } catch {
            return NextResponse.json({ error: "Invalid ticketId" }, { status: 400 });
        }

        let cart = await Cart.findOne({ userId: session.user.email });

        if (!cart) {
            cart = new Cart({ userId: session.user.email, items: [] });
        }

        // Find existing item
        const existingItem = cart.items.find(
            (item: CartItem) => item.ticketId.toString() === ticketId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                ticketName,
                ticketPrice,
                ticketCurrency,
                ticketId: objectId,
                quantity,
            });
        }

        await cart.save();

        return NextResponse.json(cart);
    } catch (error) {
        console.error("Cart update failed:", error);
        return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
    }
}

// 🛒 DELETE - Remove specific item OR clear entire cart
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const ticketId = searchParams.get("ticketId");

        const cart = await Cart.findOne({ userId: session.user.email });

        if (!cart) {
            return NextResponse.json({ error: "Cart not found" }, { status: 404 });
        }

        if (ticketId) {
            // Remove one item
            cart.items = cart.items.filter(
                (item: CartItem) => item.ticketId.toString() !== ticketId
            );
        } else {
            // Clear all items
            cart.items = [];
        }

        await cart.save();

        return NextResponse.json(cart);
    } catch (error) {
        console.error("Cart deletion failed:", error);
        return NextResponse.json({ error: "Failed to delete from cart" }, { status: 500 });
    }
}

