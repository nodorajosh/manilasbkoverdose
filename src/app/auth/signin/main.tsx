'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import Spinner from "@/components/spinner";

import GO from "../../../assets/images/google.svg";

export default function Main() {
    const { data: session } = useSession();

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<null | string>(null);

    useEffect(() => {
        if (session?.user) {
            router.push("/"); // redirect logged-in user
        }
    }, [session, router]);

    return (
        <main className="relative h-dvh w-full flex flex-wrap flex-col justify-center content-center px-6 py-12 bg-black z-5">
            <div className="glow px-6 py-12 border rounded max-w-md w-full mx-auto bg-white">
                <h1 className="text-2xl pb-3 text-center">Sign in</h1>

                <button
                    onClick={async () => {
                        setStatus("loading");
                        await signIn("google")
                        setStatus(null);
                    }}
                    className={`px-4 py-2 w-full mb-3 flex justify-between items-center border rounded capitalize cursor-pointer 
                    ${status === "loading" ?
                            "bg-gray-200 cursor-not-allowed" :
                            "bg-white hover:bg-gray-100"}`}
                    disabled={status === "loading"}
                >
                    {status === "loading" ?
                        <>
                            <span className="text-gray-500">
                                Redirecting...
                            </span>
                            <Spinner />
                        </> :
                        <>
                            <span>
                                Continue with Google
                            </span>
                            <Image src={GO} alt="Google" height={25} width={25} />
                        </>}
                </button>

                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setStatus("sending");
                        await signIn("email", { email, redirect: false });
                        setStatus("link-sent");
                    }}
                    className="space-y-3"
                >
                    <label className="block">
                        <span className="text-sm">Email</span>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            name="email"
                            required
                            className="mt-1 w-full border rounded p-2"
                            placeholder="you@example.com"
                        />
                    </label>

                    <button className={`px-4 py-2 w-full mb-3 flex items-center border rounded capitalize cursor-pointer text-white 
                    ${status === "sending" ?
                            "justify-between bg-gray-600 cursor-not-allowed" :
                            "justify-center bg-black hover:bg-gray-800"}`}
                        disabled={status === "sending"}>
                        Send magic link
                        {status === "sending" && <Spinner />}
                    </button>

                    {status === "link-sent" && <p className="text-green-600">Check your email for the magic link.</p>}
                </form>
            </div>
        </main>
    );
}
