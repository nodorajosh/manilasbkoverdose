// lib/paypal.ts
const PAYPAL_BASE =
    process.env.PAYPAL_ENV === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

function basicAuthHeader(clientId: string, secret: string) {
    return `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`;
}

/** Request an OAuth access token from PayPal */
export async function getAccessToken(): Promise<string> {
    const cid = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    if (!cid || !secret) throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET");

    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: basicAuthHeader(cid, secret),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`PayPal token error: ${res.status} ${txt}`);
    }
    const data = await res.json();
    return data.access_token as string;
}

/** Create PayPal order (returns order id and approval link)
 *
 * This version uses application_context to prefer the billing (card/guest) landing page
 * and sets user_action to PAY_NOW to encourage an immediate-pay flow.
 *
 * Note: PayPal ultimately controls the UI. landing_page: "BILLING" is a hint to show
 * the credit/debit card guest checkout when possible.
 */
export async function createPaypalOrder(params: {
    email: string;
    total: string; // "12.50"
    currency: string; // "USD"
    returnUrl: string;
    cancelUrl: string;
    referenceId?: string;
}): Promise<{ paypalOrderId: string; approveUrl?: string; raw: unknown }> {
    const token = await getAccessToken();

    const applicationContext: Record<string, unknown> = {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "PAY_NOW", // encourages immediate payment
        landing_page: "BILLING", // prefer card / guest checkout (hint)
        shipping_preference: "NO_SHIPPING", // tickets: no shipping
    };

    const body = {
        intent: "CAPTURE",
        purchase_units: [
            {
                reference_id: params.referenceId ?? undefined,
                amount: {
                    currency_code: params.currency,
                    value: params.total,
                },
            },
        ],
        application_context: applicationContext
        // {
        //     return_url: params.returnUrl,
        //     cancel_url: params.cancelUrl,
        //     user_action: "PAY_NOW", // encourages immediate payment
        //     landing_page: "BILLING", // prefer card / guest checkout (hint)
        //     shipping_preference: "NO_SHIPPING", // tickets: no shipping
        // },
        // payment_method: paymentMethodHint,
    };

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`PayPal create order failed: ${res.status} ${txt}`);
    }

    const data = await res.json();

    console.log(data)
    // // find the approve link from the returned links array
    // const approveLink = (Array.isArray((data as any).links) ? (data as any).links : []).find(
    //     (l: any) => l.rel === "payer-action"
    // )?.href;

    const approveLink = `https://www.paypal.com/checkoutweb/signup?token=${data.id}`;

    return { paypalOrderId: data.id as string, approveUrl: approveLink as string | undefined, raw: data };
}

/** Capture an approved PayPal order id */
export async function capturePaypalOrder(paypalOrderId: string) {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`PayPal capture failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    return data;
}

/** Verify PayPal webhook signature */
export async function verifyPaypalWebhook(
    headers: {
        "paypal-transmission-id": string;
        "paypal-transmission-time": string;
        "paypal-transmission-sig": string;
        "paypal-cert-url": string;
        "paypal-auth-algo": string;
    },
    body: unknown
): Promise<boolean> {
    const token = await getAccessToken();
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
        console.warn("PAYPAL_WEBHOOK_ID not set — skipping verification (not recommended)");
        return false;
    }

    const payload = {
        transmission_id: headers["paypal-transmission-id"],
        transmission_time: headers["paypal-transmission-time"],
        cert_url: headers["paypal-cert-url"],
        auth_algo: headers["paypal-auth-algo"],
        transmission_sig: headers["paypal-transmission-sig"],
        webhook_id: webhookId,
        webhook_event: body,
    };

    const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`PayPal verify-webhook-signature failed: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data.verification_status === "SUCCESS";
}
