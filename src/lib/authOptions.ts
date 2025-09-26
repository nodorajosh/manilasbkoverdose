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
 *
 * - Keeps your signIn repair callback (recreates accounts entry if missing).
 * - jwt callback now refreshes role & profileComplete from DB on every invocation,
 *   so changes to the user record (e.g. profileComplete = true) are reflected
 *   without forcing a full re-login.
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
         * signIn - repair missing accounts doc if necessary (non-destructive)
         */
        async signIn({ user, account }) {
            try {
                // Only handle OAuth-ish providers where providerAccountId exists
                if (!account?.provider || !account?.providerAccountId) return true;

                // Determine provider email (user.email or null)
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
                    const doc: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
                        provider: account.provider,
                        type: account.type ?? "oauth",
                        providerAccountId,
                        userId: existingUser._id,
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

        /**
         * jwt - refresh role & profileComplete from DB whenever possible.
         * This ensures session claims reflect DB updates (e.g. profileComplete toggled).
         */
        async jwt({ token, user }) {
            try {
                // Ensure mongoose connection and User model available when we need DB lookups
                // We'll only call connect when necessary to avoid overhead on every invocation
                // but it's safe to call (connectMongoose handles pooling).
                // If `user` is present it's a sign-in / create event: read DB by email
                if (user?.email) {
                    await connectMongoose();
                    const dbUser = await User.findOne({ email: user.email }).lean();
                    if (dbUser) {
                        (token as any).role = dbUser.role ?? "user"; // eslint-disable-line @typescript-eslint/no-explicit-any
                        (token as any).profileComplete = Boolean(dbUser.profileComplete ?? false); // eslint-disable-line @typescript-eslint/no-explicit-any
                    } else {
                        (token as any).role = (token as any).role ?? "user"; // eslint-disable-line @typescript-eslint/no-explicit-any
                        (token as any).profileComplete = (token as any).profileComplete ?? false; // eslint-disable-line @typescript-eslint/no-explicit-any
                    }
                    return token;
                }

                // Subsequent invocations (no `user`): try to refresh from DB using token.sub or token.email
                const identifier = (token as any).sub ?? (token as any).email ?? null; // eslint-disable-line @typescript-eslint/no-explicit-any
                if (!identifier) return token;

                try {
                    await connectMongoose();
                    let dbUser = null;

                    // Prefer findById when token.sub is available (it is often the user id)
                    if ((token as any).sub) { // eslint-disable-line @typescript-eslint/no-explicit-any
                        try {
                            dbUser = await User.findById((token as any).sub).lean(); // eslint-disable-line @typescript-eslint/no-explicit-any
                        } catch (e) {
                            // if findById fails for any reason, fallback to email lookup
                            dbUser = null;
                            console.log(e)
                        }
                    }

                    if (!dbUser && (token as any).email) { // eslint-disable-line @typescript-eslint/no-explicit-any
                        dbUser = await User.findOne({ email: (token as any).email }).lean(); // eslint-disable-line @typescript-eslint/no-explicit-any
                    }

                    if (dbUser) {
                        (token as any).role = dbUser.role ?? (token as any).role ?? "user"; // eslint-disable-line @typescript-eslint/no-explicit-any
                        (token as any).profileComplete = Boolean(dbUser.profileComplete ?? (token as any).profileComplete ?? false); // eslint-disable-line @typescript-eslint/no-explicit-any
                    }
                } catch (dbErr) {
                    console.error("jwt callback DB refresh error:", dbErr);
                    // swallow DB errors and return existing token so auth doesn't break
                }
            } catch (err) {
                console.error("jwt callback error:", err);
            }
            return token;
        },

        /**
         * session - expose role & profileComplete to client session
         */
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
