import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export type SessionUser = {
    email?: string | null;
    role?: string;
};

export async function createTRPCContext() {
    const session = await getServerSession(authOptions);
    return {
        session,
        user: session?.user as SessionUser | undefined,
    };
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session?.user || ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
    }
    return next({ ctx });
});
