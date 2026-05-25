import { z } from "zod";
import { connectMongoose } from "@/lib/mongoose";
import Discount from "@/models/Discount";
import Order from "@/models/Order";
import UserModel from "@/models/User";
import { Ticket } from "@/models/Ticket";
import { adminProcedure, createTRPCRouter } from "../init";
import { DEFAULT_PAGE_SIZE, paginateById, parseCursor } from "../pagination";

const listInput = z.object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
});

const statusFilter = z.enum(["active", "archived", "all"]).default("active");

function statusToFilter(status: z.infer<typeof statusFilter>, field: "active" | "status") {
    if (status === "all") return {};
    if (field === "active") {
        return status === "active" ? { active: true } : { active: false };
    }
    return status === "active" ? { status: "active" } : { status: "archived" };
}

export const adminRouter = createTRPCRouter({
    orders: createTRPCRouter({
        list: adminProcedure.input(listInput).query(async ({ input }) => {
            await connectMongoose();
            const cursorId = parseCursor(input.cursor);
            const filter: Record<string, unknown> = {};
            if (cursorId) filter._id = { $lt: cursorId };

            const docs = await Order.find(filter)
                .sort({ _id: -1 })
                .limit(input.limit + 1)
                .populate("items.ticketId")
                .lean();

            const { items, nextCursor } = paginateById(docs, input.limit);
            return { items, nextCursor };
        }),
    }),

    users: createTRPCRouter({
        list: adminProcedure.input(listInput).query(async ({ input }) => {
            await connectMongoose();
            const cursorId = parseCursor(input.cursor);
            const filter: Record<string, unknown> = {};
            if (cursorId) filter._id = { $lt: cursorId };

            const docs = await UserModel.find(filter)
                .select("name firstName lastName email image role profileComplete createdAt updatedAt")
                .sort({ _id: -1 })
                .limit(input.limit + 1)
                .lean();

            type UserLean = {
                _id: unknown;
                firstName?: string;
                lastName?: string;
                name?: string | null;
                email: string;
                image?: string | null;
                role?: string;
                profileComplete?: boolean;
                createdAt?: Date;
            };

            const { items: raw, nextCursor } = paginateById(docs as UserLean[], input.limit);
            const items = raw.map((u) => ({
                _id: String(u._id),
                name: u.firstName
                    ? `${String(u.firstName).trim()} ${u.lastName ?? ""}`.trim()
                    : u.name ?? null,
                email: u.email,
                image: u.image ?? null,
                role: (u.role ?? "user") as "user" | "admin" | "vendor",
                profileComplete: Boolean(u.profileComplete ?? false),
                createdAt: u.createdAt?.toISOString?.() ?? null,
            }));

            return { items, nextCursor };
        }),
    }),

    tickets: createTRPCRouter({
        list: adminProcedure
            .input(listInput.extend({ status: statusFilter }))
            .query(async ({ input }) => {
                await connectMongoose();
                const cursorId = parseCursor(input.cursor);
                const filter: Record<string, unknown> = {
                    ...statusToFilter(input.status, "status"),
                };
                if (cursorId) filter._id = { $lt: cursorId };

                const docs = await Ticket.find(filter)
                    .sort({ _id: -1 })
                    .limit(input.limit + 1)
                    .lean();

                const { items, nextCursor } = paginateById(docs, input.limit);
                return {
                    items: items.map((t) => ({
                        _id: String(t._id),
                        name: t.name,
                        description: t.description,
                        price: t.price,
                        currency: t.currency,
                        quantity: t.quantity,
                        sold: t.sold ?? 0,
                        metadata: t.metadata,
                        thumbnail: t.thumbnail,
                        wise: t.wise,
                        status: t.status,
                        category: t.category,
                    })),
                    nextCursor,
                };
            }),
    }),

    discounts: createTRPCRouter({
        list: adminProcedure
            .input(listInput.extend({ status: statusFilter }))
            .query(async ({ input }) => {
                await connectMongoose();
                const cursorId = parseCursor(input.cursor);
                const filter: Record<string, unknown> = {
                    ...statusToFilter(input.status, "active"),
                };
                if (cursorId) filter._id = { $lt: cursorId };

                const docs = await Discount.find(filter)
                    .sort({ _id: -1 })
                    .limit(input.limit + 1)
                    .populate("createdBy", "name email")
                    .lean();

                const { items, nextCursor } = paginateById(docs, input.limit);
                return {
                    items: items.map((d) => ({
                        _id: String(d._id),
                        code: d.code,
                        type: d.type,
                        value: d.value,
                        currency: d.currency,
                        maxUses: d.maxUses,
                        used: d.used ?? 0,
                        expiresAt: d.expiresAt?.toISOString?.() ?? null,
                        active: d.active,
                        appliesTo: (d.appliesTo ?? []).map(String),
                        metadata: d.metadata,
                        createdBy: d.createdBy,
                    })),
                    nextCursor,
                };
            }),

        usageStats: adminProcedure.query(async () => {
            await connectMongoose();
            const discounts = await Discount.find()
                .select("code used maxUses active")
                .sort({ used: -1 })
                .lean();

            return discounts.map((d) => ({
                code: d.code,
                used: d.used ?? 0,
                maxUses: d.maxUses,
                active: d.active,
            }));
        }),
    }),
});
