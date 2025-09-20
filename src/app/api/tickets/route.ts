import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";

export async function GET() {
    try {
        await connectMongoose();
        const tickets = await Ticket.find({ status: "active" }).sort({ createdAt: -1 });
        return NextResponse.json(tickets, { status: 200 });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json(
            { error: "Failed to fetch tickets" },
            { status: 500 }
        );
    }
}
