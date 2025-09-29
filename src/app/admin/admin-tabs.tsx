// app/admin/admin-tabs.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

import TicketsAdmin from "./tickets-admin";
import DiscountsAdmin from "./discounts-admin";
import OrdersAdmin from "./orders-admin";
import UsersAdmin from "./users-admin";

type TabId = "orders" | "users" | "tickets" | "discounts";

const TABS: { id: TabId; title: string; desc?: string }[] = [
    { id: "orders", title: "Manage Orders", desc: "View orders and update statuses" },
    { id: "users", title: "Manage Users", desc: "View users" },
    { id: "tickets", title: "Tickets", desc: "List, edit, archive and create tickets" },
    { id: "discounts", title: "Create Discount", desc: "Create promo codes and limits" },
];

export default function AdminTabs() {
    const [active, setActive] = useState<TabId>("orders");
    const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
    const panelsRef = useRef<Record<TabId, HTMLDivElement | null>>({
        orders: null,
        users: null,
        tickets: null,
        discounts: null,
    });

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const idx = TABS.findIndex((t) => t.id === active);
        if (e.key === "ArrowRight") {
            const next = TABS[(idx + 1) % TABS.length].id;
            setActive(next);
            tabsRef.current[(idx + 1) % TABS.length]?.focus();
        } else if (e.key === "ArrowLeft") {
            const prev = TABS[(idx - 1 + TABS.length) % TABS.length].id;
            setActive(prev);
            tabsRef.current[(idx - 1 + TABS.length) % TABS.length]?.focus();
        } else if (e.key === "Home") {
            setActive(TABS[0].id);
            tabsRef.current[0]?.focus();
        } else if (e.key === "End") {
            setActive(TABS[TABS.length - 1].id);
            tabsRef.current[TABS.length - 1]?.focus();
        }
    };

    useEffect(() => {
        const panel = panelsRef.current[active];
        if (panel) panel.focus();
    }, [active]);

    return (
        <div className="bg-gray-900/60 rounded p-4 border border-white/10">
            <div className="flex flex-col gap-4">
                <div role="tablist" aria-orientation="horizontal" onKeyDown={onKeyDown} className="flex gap-2 overflow-auto pb-2">
                    {TABS.map((tab, i) => (
                        <button
                            key={tab.id}
                            ref={(el) => {
                                tabsRef.current[i] = el;
                            }}
                            role="tab"
                            aria-selected={active === tab.id}
                            aria-controls={`panel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            onClick={() => setActive(tab.id)}
                            className={`px-4 py-2 rounded-t-md focus:outline-none border-b-2 ${active === tab.id ? "bg-white text-black border-b-white" : "bg-transparent text-white/80 border-b-transparent hover:bg-white/5"
                                }`}
                        >
                            <div className="font-semibold">{tab.title}</div>
                            {tab.desc && <div className="text-xs opacity-70">{tab.desc}</div>}
                        </button>
                    ))}
                </div>

                <div className="flex-1 w-full">
                    {/* Orders */}
                    <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders" tabIndex={-1} ref={(el) => { panelsRef.current.orders = el; }} hidden={active !== "orders"} className={`${active === "orders" ? "block" : "hidden"} p-4`}>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">Manage Orders</h2>
                            <p className="text-sm text-white/70">View incoming orders, update statuses and fulfill.</p>
                        </div>
                        <OrdersAdmin />

                    </div>

                    {/* Users */}
                    <div id="panel-users" role="tabpanel" aria-labelledby="tab-users" tabIndex={-1} ref={(el) => { panelsRef.current.users = el }} hidden={active !== "users"} className={`${active === "users" ? "block" : "hidden"} p-4`}>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">Manage Users</h2>
                            <p className="text-sm text-white/70">View users.</p>
                            <UsersAdmin />
                        </div>

                    </div>

                    {/* Tickets */}
                    <div id="panel-tickets" role="tabpanel" aria-labelledby="tab-tickets" tabIndex={-1} ref={(el) => { panelsRef.current.tickets = el }} hidden={active !== "tickets"} className={`${active === "tickets" ? "block" : "hidden"} p-4`}>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">Tickets Admin</h2>
                            <p className="text-sm text-white/70">List, edit, archive and create tickets.</p>
                        </div>
                        <TicketsAdmin />
                    </div>

                    {/* Discounts */}
                    <div id="panel-discounts" role="tabpanel" aria-labelledby="tab-discounts" tabIndex={-1} ref={(el) => { panelsRef.current.discounts = el }} hidden={active !== "discounts"} className={`${active === "discounts" ? "block" : "hidden"} p-4`}>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">Create Discount</h2>
                            <p className="text-sm text-white/70">Create promo codes, set limits and expiration.</p>
                        </div>
                        <DiscountsAdmin />
                    </div>
                </div>
            </div>
        </div>
    );
}
