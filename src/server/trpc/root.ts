import { createTRPCRouter } from "./init";
import { adminRouter } from "./routers/admin";

export const appRouter = createTRPCRouter({
    admin: adminRouter,
});

export type AppRouter = typeof appRouter;
