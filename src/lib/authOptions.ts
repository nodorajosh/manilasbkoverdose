// lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb-client";
import User from "@/models/User";
import { connectMongoose } from "./mongoose";

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
        }),
    ],
    session: { strategy: "jwt" }, // use JWT sessions, good for serverless
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        // attach role into JWT token (so middleware can read it)
        async jwt({ token, user }) {
            // On sign-in, `user` will be set
            if (user?.email) {
                await connectMongoose(); // ensure models accessible
                const dbUser = await User.findOne({ email: user.email });
                token.role = dbUser?.role ?? "user";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) session.user.role = (token as any).role ?? "user"; // eslint-disable-line @typescript-eslint/no-explicit-any
            return session;
        },
    },
    events: {
        async createUser({ user }) {
            await connectMongoose();
            await User.findByIdAndUpdate(user.id, { role: "user" });
        }
    }
};
