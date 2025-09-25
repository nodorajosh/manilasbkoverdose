// lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb-client";
import User from "@/models/User";
import { connectMongoose } from "./mongoose";

/**
 * authOptions for NextAuth
 * - Includes jwt/session callbacks that attach role & profileComplete
 * - Includes events.createUser to seed role
 * - Includes a signIn callback that repairs a missing `accounts` doc when an OAuth provider
 *   signs in with an email that already exists in your users collection.
 */
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
    session: { strategy: "jwt" },
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        /**
         * signIn - runs on every sign-in attempt (OAuth & Email).
         * We attempt a best-effort repair of the `accounts` collection if it was dropped.
         * This is safe for verified provider emails (Google).
         */
        async signIn({ user, account }) {
            try {
                // Only handle OAuth-ish providers where providerAccountId exists
                if (!account?.provider || !account?.providerAccountId) return true;

                // Determine provider email (user.email or email?.value)
                const providerEmail = user?.email ?? null;
                if (!providerEmail) return true;

                // Ensure mongoose models are available (so User model works)
                await connectMongoose().catch(() => { /* ignore if already connected */ });

                // Look up existing user by email in your users collection
                const existingUser = await User.findOne({ email: providerEmail }).lean();

                // If no existing user, let the adapter create a new one as usual
                if (!existingUser) return true;

                // Use the raw Mongo client to inspect/insert an accounts doc
                const client = await clientPromise;
                const db = client.db(); // uses DB from your connection string
                const accountsColl = db.collection("accounts");

                const providerAccountId = String(account.providerAccountId);

                // If an account entry already exists for this providerAccountId, do nothing
                const found = await accountsColl.findOne({
                    provider: account.provider,
                    providerAccountId,
                });

                if (!found) {
                    // Insert a minimal adapter-compatible accounts document linking to the user
                    // The adapter uses at least: provider, type, providerAccountId, userId
                    // Add token fields if present (helpful but not required).
                    const doc: any = {
                        provider: account.provider,
                        type: account.type ?? "oauth",
                        providerAccountId,
                        userId: existingUser._id, // keep as ObjectId if present
                        access_token: account?.access_token ?? null,
                        expires_at: account?.expires_at ?? null,
                        scope: account?.scope ?? null,
                        token_type: account?.token_type ?? null,
                        id_token: account?.id_token ?? null,
                    };

                    await accountsColl.insertOne(doc);
                    console.log("Recreated accounts entry for", providerEmail, "provider:", account.provider);
                }

                return true;
            } catch (err) {
                // Don't block sign-in if repair fails — log and allow fallback behavior
                console.error("signIn callback repair error:", err);
                return true;
            }
        },

        // attach role & profileComplete into the JWT (so middleware and server can read it)
        async jwt({ token, user }) {
            if (user?.email) {
                await connectMongoose(); // ensure models accessible
                const dbUser = await User.findOne({ email: user.email });
                token.role = dbUser?.role ?? "user";
                token.profileComplete = dbUser?.profileComplete ?? false;
            }
            return token;
        },

        // expose role & profileComplete on session.user
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = (token as any).role ?? "user"; // eslint-disable-line @typescript-eslint/no-explicit-any
                (session.user as any).profileComplete = (token as any).profileComplete ?? false; // eslint-disable-line @typescript-eslint/no-explicit-any
            }
            return session;
        },
    },
    events: {
        async createUser({ user }) {
            await connectMongoose();
            // ensure new users have a default role
            await User.findByIdAndUpdate(user.id, { role: "user" });
        },
    },
};
