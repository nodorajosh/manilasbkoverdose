import { z } from "zod";
import { connectMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { createTRPCRouter, userProcedure, adminProcedure } from "../init";

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const profilePayload = (user: Record<string, unknown>) => ({
    _id: String(user._id),
    email: user.email as string,
    image: (user.image as string) ?? null,
    firstName: (user.firstName as string) ?? null,
    lastName: (user.lastName as string) ?? null,
    phone: (user.phone as string) ?? null,
    dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth as Date).toISOString()
        : null,
    address: (user.address as Record<string, string>) ?? null,
    profileComplete: Boolean(user.profileComplete ?? false),
    role: (user.role as string) ?? "user",
});

const updateProfileSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(4),
    dateOfBirth: z.string().min(4),
    address: z.object({
        line1: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        zip: z.string().min(1),
        country: z.string().min(2),
    }),
    image: z.string().optional().nullable(),
});

async function applyProfileUpdate(
    user: Record<string, unknown>,
    data: z.infer<typeof updateProfileSchema>,
) {
    const doc = user as Record<string, unknown>;
    doc.firstName = data.firstName;
    doc.lastName = data.lastName;
    doc.phone = data.phone;
    doc.dateOfBirth = new Date(data.dateOfBirth);
    doc.address = data.address;
    if (data.image) doc.image = data.image;

    doc.profileComplete = Boolean(
        doc.firstName &&
            doc.lastName &&
            doc.phone &&
            doc.dateOfBirth &&
            (doc.address as Record<string, unknown>)?.line1 &&
            (doc.address as Record<string, unknown>)?.city &&
            (doc.address as Record<string, unknown>)?.country &&
            (doc.address as Record<string, unknown>)?.zip,
    );
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const orderItemOutput = (item: Record<string, unknown>) => ({
    ticketId: String(item.ticketId ?? ""),
    name: (item.name as string) ?? "",
    price: (item.price as number) ?? 0,
    currency: (item.currency as string) ?? "",
    quantity: (item.quantity as number) ?? 1,
});

const orderOutput = (order: Record<string, unknown>) => ({
    _id: String(order._id),
    userId: (order.userId as string) ?? "",
    userEmail: (order.userEmail as string) ?? null,
    items: ((order.items as Record<string, unknown>[]) ?? []).map(orderItemOutput),
    totalAmount: (order.totalAmount as number) ?? 0,
    currency: (order.currency as string) ?? "",
    status: (order.status as string) ?? "pending",
    paymentDetails: (order.paymentDetails as Record<string, unknown>) ?? null,
    createdAt: order.createdAt
        ? new Date(order.createdAt as Date).toISOString()
        : null,
    updatedAt: order.updatedAt
        ? new Date(order.updatedAt as Date).toISOString()
        : null,
});

export const userRouter = createTRPCRouter({
    // ---- Profile ----

    profile: createTRPCRouter({
        /** Get the authenticated user's own profile */
        get: userProcedure.query(async ({ ctx }) => {
            await connectMongoose();
            const user = await User.findOne({ email: ctx.user!.email })
                .lean();
            if (!user) throw new Error("User not found");
            return { user: profilePayload(user as Record<string, unknown>) };
        }),

        /** Update the authenticated user's own profile */
        update: userProcedure
            .input(updateProfileSchema)
            .mutation(async ({ ctx, input }) => {
                await connectMongoose();
                const user = await User.findOne({ email: ctx.user!.email });
                if (!user) throw new Error("User not found");

                await applyProfileUpdate(
                    user as unknown as Record<string, unknown>,
                    input,
                );
                await user.save();

                return {
                    user: profilePayload(
                        user.toObject() as Record<string, unknown>,
                    ),
                };
            }),

        /** Admin: get a user's profile by email */
        getByEmail: adminProcedure
            .input(z.object({ email: z.string().email() }))
            .query(async ({ input }) => {
                await connectMongoose();
                const user = await User.findOne({ email: input.email }).lean();
                if (!user) throw new Error("User not found");
                return { user: profilePayload(user as Record<string, unknown>) };
            }),

        /** Admin: update a user's profile by email */
        updateByEmail: adminProcedure
            .input(
                updateProfileSchema.extend({ email: z.string().email() }),
            )
            .mutation(async ({ input }) => {
                const { email, ...data } = input;
                await connectMongoose();
                const user = await User.findOne({ email });
                if (!user) throw new Error("User not found");

                await applyProfileUpdate(
                    user as unknown as Record<string, unknown>,
                    data,
                );
                await user.save();

                return {
                    user: profilePayload(
                        user.toObject() as Record<string, unknown>,
                    ),
                };
            }),
    }),

    // ---- Orders ----

    orders: createTRPCRouter({
        /** List the authenticated user's own orders */
        list: userProcedure.query(async ({ ctx }) => {
            await connectMongoose();
            const docs = await Order.find({ userId: ctx.user!.email })
                .sort({ createdAt: -1 })
                .populate("items.ticketId")
                .lean();
            return { orders: docs.map((o) => orderOutput(o as Record<string, unknown>)) };
        }),

        /** Admin: list orders for a specific user by email */
        listByUserEmail: adminProcedure
            .input(z.object({ email: z.string().email() }))
            .query(async ({ input }) => {
                await connectMongoose();
                const docs = await Order.find({ userId: input.email })
                    .sort({ createdAt: -1 })
                    .populate("items.ticketId")
                    .lean();
                return { orders: docs.map((o) => orderOutput(o as Record<string, unknown>)) };
            }),

        /** Cancel a pending / created order (user can cancel their own) */
        cancel: userProcedure
            .input(z.object({ orderId: z.string().min(1) }))
            .mutation(async ({ ctx, input }) => {
                await connectMongoose();
                const order = await Order.findById(input.orderId);
                if (!order) throw new Error("Order not found");

                // ensure ownership
                if (String(order.userId) !== ctx.user!.email) {
                    throw new Error("Unauthorized");
                }

                if (!["pending", "created"].includes(order.status)) {
                    throw new Error("Cannot cancel order in this status");
                }

                order.status = "cancelled";
                (order as Record<string, unknown>).cancelledAt = new Date();
                await order.save();

                return { order: orderOutput(order.toObject() as Record<string, unknown>) };
            }),
    }),
});
