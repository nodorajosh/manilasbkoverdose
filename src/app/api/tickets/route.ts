import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";

export async function GET() {
    try {
        await connectMongoose();
        const tickets = await Ticket.find({ status: "active" })
            .select("name description price currency quantity sold category metadata thumbnail wise.enabled")
            .sort({ createdAt: -1 })
            .lean();
        const rank = (name: string) => {
            const normalized = name.toLowerCase();
            if (normalized.includes("full festival")) return 0;
            if (normalized.includes("premium") || normalized.includes("vip")) return 2;
            return 1;
        };
        const orderedTickets = tickets
            .sort((a, b) => rank(a.name ?? "") - rank(b.name ?? ""))
            .map((ticket) => ({
                _id: ticket._id,
                name: ticket.name,
                description: ticket.description,
                price: ticket.price,
                currency: ticket.currency,
                quantity: ticket.quantity,
                sold: ticket.sold ?? 0,
                category: ticket.category,
                metadata: ticket.metadata,
                thumbnail: ticket.thumbnail,
                wise: { enabled: Boolean(ticket.wise?.enabled) },
            }));
        return NextResponse.json(orderedTickets, { status: 200 });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}
