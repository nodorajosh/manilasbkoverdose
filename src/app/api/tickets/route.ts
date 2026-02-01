import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";

export async function GET() {
    try {
        await connectMongoose();
        const tickets = await Ticket.find({ status: "active" }).sort({ createdAt: -1 });
        const orderedTickets = tickets.sort((a, b) => {
            const rank = (t: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const name = (t.name || "").toLowerCase();

                if (name.includes("full festival")) return 0;

                if (name.includes("premium")) return 2;
                if (name.includes("vip")) return 2;

                return 1;
            };

            return rank(a) - rank(b);
        });
        return NextResponse.json(orderedTickets, { status: 200 });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json(
            { error: "Failed to fetch tickets" },
            { status: 500 }
        );
    }
}
