import { createTRPCRouter } from "./init";
import { adminRouter } from "./routers/admin";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
    admin: adminRouter,
    user: userRouter,
});

export type AppRouter = typeof appRouter;
