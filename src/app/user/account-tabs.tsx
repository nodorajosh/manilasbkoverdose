// components/user/AccountTabs.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import OrdersList from "./orders-list";
import ProfileForm from "./profile-form";

type TabId = "orders" | "profile";

const TABS: { id: TabId; title: string; desc?: string }[] = [
    { id: "orders", title: "My Orders", desc: "View your purchases & receipts" },
    { id: "profile", title: "Profile", desc: "Update your personal details" },
];

export default function AccountTabs() {
    const { data: session } = useSession();

    const [active, setActive] = useState<TabId>(session?.user.profileComplete ? "orders" : "profile");
    const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
    const panelsRef = useRef<Record<TabId, HTMLDivElement | null>>({ orders: null, profile: null });

    useEffect(() => {
        const panel = panelsRef.current[active];
        if (panel) panel.focus();
    }, [active]);

    return (
        <div className="bg-gray-900/60 rounded p-4 border border-white/10">
            <div className="flex flex-col gap-4">
                <div role="tablist" aria-orientation="horizontal" className="flex gap-2 overflow-auto pb-2">
                    {TABS.map((tab, i) => (
                        <button
                            key={tab.id}
                            ref={(el) => { tabsRef.current[i] = el }}
                            role="tab"
                            aria-selected={active === tab.id}
                            aria-controls={`panel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            onClick={() => setActive(tab.id)}
                            className={`px-4 py-2 rounded-t-md focus:outline-none border-b-2 ${active === tab.id ? "bg-white text-black border-b-white" : "bg-transparent text-white/80 border-b-transparent hover:bg-white/5"
                                }`}
                            disabled={tab.title === "My Orders" && !session?.user.profileComplete}
                        >
                            <div className="font-semibold">{tab.title}</div>
                            {tab.desc && <div className="text-xs opacity-70">{tab.desc}</div>}
                        </button>
                    ))}
                </div>

                <div className="flex-1 w-full">
                    <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders" tabIndex={-1} ref={(el) => { panelsRef.current.orders = el }} hidden={active !== "orders"} className={`${active === "orders" ? "block" : "hidden"} p-4`}>
                        <OrdersList />
                    </div>

                    <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" tabIndex={-1} ref={(el) => { panelsRef.current.profile = el }} hidden={active !== "profile"} className={`${active === "profile" ? "block" : "hidden"} p-4`}>
                        <ProfileForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
