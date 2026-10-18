import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoose } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import { Ticket } from "@/models/Ticket";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

type CartItem = {
    ticketName: string;
    ticketPrice: number;
    ticketCurrency: string;
    ticketId: mongoose.Types.ObjectId | string;
    quantity: number;
    discountCode?: string | null;
    discountedPrice?: number | null;
};

function validateQuantity(quantity: unknown) {
    return typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0;
}

async function getActiveTicket(ticketId: string) {
    if (!mongoose.isValidObjectId(ticketId)) return null;
    return Ticket.findOne({ _id: ticketId, status: "active" });
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await connectMongoose();
        const cart = await Cart.findOne({ userId: session.user.email });
        return NextResponse.json(cart ?? { items: [] });
    } catch (error) {
        console.error("Cart fetch failed:", error);
        return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const ticketId = typeof body.ticketId === "string" ? body.ticketId : "";
        const quantity = body.quantity ?? 1;
        if (!ticketId) {
            return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
        }
        if (!validateQuantity(quantity)) {
            return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 });
        }

        await connectMongoose();
        const ticket = await getActiveTicket(ticketId);
        if (!ticket) {
            return NextResponse.json({ error: "Active ticket not found" }, { status: 404 });
        }

        const remaining = Math.max(0, Number(ticket.quantity ?? 0) - Number(ticket.sold ?? 0));
        let cart = await Cart.findOne({ userId: session.user.email });
        if (!cart) cart = new Cart({ userId: session.user.email, items: [] });

        const sameTicketEntries = cart.items.filter(
            (item: CartItem) => item.ticketId.toString() === ticketId
        );
        const totalQuantity = sameTicketEntries.reduce(
            (sum: number, item: CartItem) => sum + item.quantity,
            0
        ) + quantity;
        if (totalQuantity > remaining) {
            return NextResponse.json({ error: `Only ${remaining} ticket(s) remaining` }, { status: 400 });
        }

        const canonicalItem = {
            ticketName: ticket.name,
            ticketPrice: ticket.price,
            ticketCurrency: ticket.currency ?? "USD",
            ticketId: ticket._id,
        };
        const discountCode = typeof body.discountCode === "string" ? body.discountCode : null;
        const discountedPrice = typeof body.discountedPrice === "number" && Number.isFinite(body.discountedPrice)
            ? body.discountedPrice
            : null;

        if (discountCode) {
            cart.items = [
                ...cart.items.filter((item: CartItem) => item.ticketId.toString() !== ticketId),
                {
                    ...canonicalItem,
                    quantity: totalQuantity,
                    discountCode,
                    discountedPrice,
                },
            ];
        } else {
            const existingItem = cart.items.find(
                (item: CartItem) => item.ticketId.toString() === ticketId && !item.discountCode
            );
            if (existingItem) {
                existingItem.ticketName = canonicalItem.ticketName;
                existingItem.ticketPrice = canonicalItem.ticketPrice;
                existingItem.ticketCurrency = canonicalItem.ticketCurrency;
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    ...canonicalItem,
                    quantity,
                    discountCode: null,
                    discountedPrice: null,
                });
            }
        }

        await cart.save();
        return NextResponse.json(cart);
    } catch (error) {
        console.error("Cart update failed:", error);
        return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const ticketId = typeof body.ticketId === "string" ? body.ticketId : "";
        const quantity = body.quantity;
        if (!ticketId || !validateQuantity(quantity)) {
            return NextResponse.json(
                { error: "ticketId and a positive integer quantity are required" },
                { status: 400 }
            );
        }

        await connectMongoose();
        const ticket = await getActiveTicket(ticketId);
        if (!ticket) {
            return NextResponse.json({ error: "Active ticket not found" }, { status: 404 });
        }

        const remaining = Math.max(0, Number(ticket.quantity ?? 0) - Number(ticket.sold ?? 0));
        if (quantity > remaining) {
            return NextResponse.json({ error: `Only ${remaining} ticket(s) remaining` }, { status: 400 });
        }

        let cart = await Cart.findOne({ userId: session.user.email });
        if (!cart) cart = new Cart({ userId: session.user.email, items: [] });

        const firstIndex = cart.items.findIndex(
            (item: CartItem) => item.ticketId.toString() === ticketId
        );
        if (firstIndex >= 0) {
            const existingItem = cart.items[firstIndex];
            existingItem.ticketName = ticket.name;
            existingItem.ticketPrice = ticket.price;
            existingItem.ticketCurrency = ticket.currency ?? "USD";
            existingItem.quantity = quantity;
            cart.items = cart.items.filter(
                (item: CartItem, index: number) => item.ticketId.toString() !== ticketId || index === firstIndex
            );
        } else {
            cart.items.push({
                ticketName: ticket.name,
                ticketPrice: ticket.price,
                ticketCurrency: ticket.currency ?? "USD",
                ticketId: ticket._id,
                quantity,
                discountCode: null,
                discountedPrice: null,
            });
        }

        await cart.save();
        return NextResponse.json(cart);
    } catch (error) {
        console.error("Cart quantity update failed:", error);
        return NextResponse.json({ error: "Failed to update cart quantity" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await connectMongoose();
        const { searchParams } = new URL(req.url);
        const ticketId = searchParams.get("ticketId");
        if (ticketId && !mongoose.isValidObjectId(ticketId)) {
            return NextResponse.json({ error: "Invalid ticketId" }, { status: 400 });
        }

        const cart = await Cart.findOne({ userId: session.user.email });
        if (!cart) {
            return NextResponse.json({ error: "Cart not found" }, { status: 404 });
        }

        cart.items = ticketId
            ? cart.items.filter((item: CartItem) => item.ticketId.toString() !== ticketId)
            : [];
        await cart.save();
        return NextResponse.json(cart);
    } catch (error) {
        console.error("Cart deletion failed:", error);
        return NextResponse.json({ error: "Failed to delete from cart" }, { status: 500 });
    }
}
