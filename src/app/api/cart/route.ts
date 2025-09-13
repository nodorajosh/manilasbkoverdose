import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Cart from "@/models/Cart";
import { connectMongoose } from "@/lib/mongoose";

export async function GET() {
    await connectMongoose();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let cart = await Cart.findOne({ userId: session.user.email }).populate("items.ticketId");
    if (!cart) {
        cart = await Cart.create({ userId: session.user.email, items: [] });
    }

    return NextResponse.json(cart);
}

export async function POST(req: Request) {
    await connectMongoose();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId, quantity } = await req.json();

    let cart = await Cart.findOne({ userId: session.user.email });
    if (!cart) {
        cart = await Cart.create({
            userId: session.user.email,
            items: [{ ticketId, quantity }],
        });
    } else {
        const existingItem = cart.items.find(
            (item: any) => item.ticketId.toString() === ticketId
        );
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ ticketId, quantity });
        }
        await cart.save();
    }

    return NextResponse.json(cart);
}

export async function DELETE(req: Request) {
    await connectMongoose();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId } = await req.json();
    const cart = await Cart.findOne({ userId: session.user.email });
    if (!cart) {
        return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    cart.items = cart.items.filter(
        (item: any) => item.ticketId.toString() !== ticketId
    );
    await cart.save();

    return NextResponse.json(cart);
}
