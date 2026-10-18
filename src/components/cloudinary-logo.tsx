"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export const FIXED_LOGO_URL = "https://res.cloudinary.com/dmioegrww/image/upload/v1792288761/trimmed_1756999440-trimmy-MNLSBKZ-S_LOGO_siaoqu.png";

type LogoPayload = {
    url: string;
    width: number;
    height: number;
};

export default function CloudinaryLogo({ className = "" }: { className?: string }) {
    const [logo, setLogo] = useState<LogoPayload | null>(null);

    useEffect(() => {
        let active = true;
        fetch("/api/branding/logo", { cache: "no-store" })
            .then(async (response) => {
                if (!response.ok) return null;
                return response.json() as Promise<LogoPayload>;
            })
            .then((payload) => {
                if (active && payload?.url) setLogo(payload);
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, []);

    return (
        <Image
            src={logo?.url ?? FIXED_LOGO_URL}
            alt="Manila SBKZ Overdose Logo"
            width={logo?.width ?? 240}
            height={logo?.height ?? 80}
            className={className}
            unoptimized={Boolean(logo)}
        />
    );
}
