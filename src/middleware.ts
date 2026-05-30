// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ token, req }) => {
            // token is the JWT set by NextAuth callbacks
            const url = req.nextUrl.pathname;

            // admin-only paths
            if (url.startsWith("/admin")) {
                return token?.role === "admin";
            }

            // user / account paths require authentication
            if (url.startsWith("/user")) {
                return !!token;
            }

            // dashboard requires authenticated user
            if (url.startsWith("/dashboard")) {
                return !!token;
            }

            // public paths allowed
            return true;
        },
    },
});

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/user/:path*"],
};
