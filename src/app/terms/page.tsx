// app/terms/page.tsx
import Link from "next/link";

export const metadata = {
    title: "Terms of Service — Manila SBKZ Overdose",
    description: "Terms of Service and Data Privacy for Manila SBKZ Overdose",
};

export default function TermsPage() {
    return (
        <main className="prose prose-lg max-w-4xl mx-auto px-6 py-12">
            <h1>Terms of Service</h1>

            <p>
                <strong>Last updated:</strong> September 30, 2025
            </p>

            <section>
                <h2>Introduction</h2>
                <p>
                    These Terms of Service (&quot;Terms&quot;) govern your use of the website and
                    services provided by <strong>Manila SBKZ Overdose</strong> (&quot;we&quot;,
                    &quot;us&quot;, &quot;our&quot;). By registering, buying tickets, or otherwise using our
                    services you agree to these Terms. If you do not agree, do not use
                    our services.
                </p>
            </section>

            <section>
                <h2>Who we are & contact</h2>
                <p>
                    <strong>Business name:</strong> Manila SBK-Overdose Entertainment Production
                    <br />
                    <strong>Contact email:</strong>{" "}
                    <a href="mailto:manilasbkzoverdose@gmail.com">manilasbkzoverdose@gmail.com</a>
                    <br />
                    <strong>Support phone:</strong> +63 956 518 3562
                </p>
                <p>
                    These contact details are provided to assist with account verification
                    and for any customer service matters.
                </p>
            </section>

            <section>
                <h2>Scope of Services</h2>
                <p>
                    We organize and sell tickets to the Manila SBKZ Overdose festival,
                    including workshops, parties, and related events. Specific details
                    about ticket types, event schedules, add-ons, and eligibility are
                    published on our site and form part of these Terms.
                </p>
            </section>

            <section>
                <h2>Eligibility</h2>
                <p>
                    You must be at least 18 years old to purchase certain tickets or to
                    participate in some events where age restrictions apply. By purchasing
                    a ticket you represent that you meet any eligibility requirements
                    posted for that ticket or event.
                </p>
            </section>

            <section>
                <h2>Accounts & Registration</h2>
                <p>
                    When you create an account, you agree to provide accurate information
                    and to keep it up to date. You are responsible for your account
                    security and for any activity that happens under your account.
                </p>
            </section>

            <section>
                <h2>Ordering, Payment & Billing</h2>
                <p>
                    We accept payments via our supported payment methods as shown at
                    checkout. We offer bank-transfer options (for example
                    via Wise) or checkout via third-party providers such as Paddle where
                    applicable. You agree to pay all fees, taxes and charges for the
                    orders you place.
                </p>
                <p>
                    If a third-party provider such as Paddle processes your purchase, you
                    may be asked to accept the provider&apos;s additional terms. When you pay
                    via a third-party provider, that provider acts as the merchant of
                    record and some fulfilment, complaint handling, or tax obligations
                    may be delegated to them in accordance with their policies.
                </p>
            </section>

            <section>
                <h2>Refunds, Cancellations & Transfers</h2>
                <p>
                    <strong>General policy:</strong> Tickets are refundable only as set
                    out below. If an event is canceled by the organizers, we will provide
                    a refund or equivalent credit. Refunds may be subject to a processing
                    fee to cover payment fees and administrative costs.
                </p>
                <p>
                    <strong>Standard ticket refund window:</strong>{" "}
                    Tickets for in-person events purchased more than 14 days before the
                    event are eligible for a refund minus a 10% processing fee. Tickets
                    purchased 14 days or less before the event are non-refundable.
                </p>
                <p>
                    <strong>Transfers:</strong> Tickets are transferable unless explicitly
                    stated otherwise in the ticket terms. Transfers may be subject to a
                    fee and identity verification at event entry.
                </p>
                <p>
                    <strong>Third-party payment provider refunds:</strong> If your
                    purchase was processed by a third-party merchant (for example,
                    Paddle), refunds and chargebacks will be handled in accordance with
                    that provider&apos;s policies. In some cases Paddle acts as merchant of
                    record and will have its own refund procedures.
                </p>
            </section>

            <section>
                <h2>Event Changes, Postponements & Cancellation by Organizer</h2>
                <p>
                    We may change event details (date, time, venue, lineup) for operational
                    reasons. In case of postponement, your ticket will be valid for the
                    rescheduled date. In case of cancellation you will be eligible for a
                    refund in accordance with the policy above. We are not responsible
                    for travel or accommodation costs.
                </p>
            </section>

            <section>
                <h2>Code of Conduct & Safety</h2>
                <p>
                    Attendees must follow venue rules and instructions by staff. We
                    reserve the right to refuse entry or remove any attendee for
                    disruptive, abusive, or unsafe behavior without refund.
                </p>
            </section>

            <section>
                <h2>Intellectual Property</h2>
                <p>
                    All site content, logos, images, and designs are our property or used
                    with permission. You may not copy, reproduce, or distribute our
                    intellectual property without written consent.
                </p>
            </section>

            <section>
                <h2>Liability & Disclaimers</h2>
                <p>
                    To the maximum extent permitted by law, our liability for any direct
                    loss arising from use of the site or attendance at events is limited
                    to the total fees paid by you for the relevant ticket. We are not
                    liable for indirect or consequential losses. Nothing in these Terms
                    excludes liability for personal injury or death caused by our
                    negligence.
                </p>
            </section>

            <section>
                <h2>Third-Party Services</h2>
                <p>
                    We use third-party providers for payments, email, analytics, image
                    hosting and other services. These providers have their own terms and
                    privacy policies; use of those services is subject to their terms.
                </p>
            </section>

            <section>
                <h2>Data Privacy (Full clause)</h2>
                <p>
                    <strong>Purpose:</strong> We collect and process your personal
                    information to provide event services, process and confirm orders,
                    send tickets and receipts, and communicate event-related updates such
                    as schedule changes or cancellations.
                </p>

                <p>
                    <strong>Information we collect:</strong> Personal details (name,
                    email, phone number), billing details (address, card or bank details
                    processed by our payment processors), purchase history, uploaded
                    photos or media (where consented), and technical data (IP address,
                    device and browser details). We may also collect optional profile
                    fields and marketing preferences.
                </p>

                <p>
                    <strong>How we store data:</strong> We store personal and order data in
                    our database. Currently photos may be stored as base64 in the
                    database for development/testing; we recommend migrating to object
                    storage (e.g., AWS S3 or Cloudinary) for production to reduce DB
                    load. Access to personal data is restricted to authorized personnel.
                </p>

                <p>
                    <strong>Sharing and processors:</strong> We do not sell personal data.
                    We share necessary information with payment processors (Stripe, Wise,
                    PayPal, or Paddle) to complete transactions and comply with legal
                    obligations. We also use service providers for email, analytics and
                    hosting who act as processors under the applicable data protection
                    laws.
                </p>

                <p>
                    <strong>Retention:</strong> We retain order and billing data for
                    accounting and legal compliance for a minimum period required by law.
                    You may request deletion of your personal data by contacting{" "}
                    <a href="mailto:manilasbkzoverdose@gmail.com">manilasbkzoverdose@gmail.com</a>.
                    Note that deletion may prevent us from fulfilling or referencing past
                    orders or warranties.
                </p>

                <p>
                    <strong>Your rights:</strong> Depending on your jurisdiction, you may
                    have the right to access, correct, port, restrict, or delete your
                    personal data. To exercise your rights, contact us at the email
                    above. We will respond in accordance with applicable timelines.
                </p>

                <p>
                    <strong>Security:</strong> We use industry-standard measures such as
                    TLS for data in transit and access controls for data at rest. While
                    we strive to protect your data, no system is 100% secure; you should
                    take care with credentials and sharing sensitive information.
                </p>

                {/* <p>
          <strong>Cookies & tracking:</strong> Our site uses cookies and similar
          technologies for essential functionality, analytics and marketing.
          You may control cookie permissions via your browser settings or our
          cookie banner.
        </p> */}
            </section>

            <section>
                <h2>Paddle & Account Verification</h2>
                <p>
                    When using Paddle as a payment provider, Paddle requires verification
                    of merchant details including a public website with accessible Terms,
                    a Privacy Policy, a clear product description, and contact details.
                    Paddle may also request identity verification (ID, selfie) and proof
                    of business registration for KYB checks. We maintain this Terms page
                    to support their verification process.
                </p>
            </section>

            <section>
                <h2>Governing Law & Dispute Resolution</h2>
                <p>
                    These Terms are governed by the laws of <strong>The Philippines</strong>. Any dispute will be resolved by the courts of
                    that jurisdiction unless otherwise required by law.
                </p>
            </section>

            <section>
                <h2>Changes to Terms</h2>
                <p>
                    We may update these Terms from time to time. Material changes will be
                    communicated via email or on the site. Continued use of the services
                    after notice constitutes acceptance of the updated Terms.
                </p>
            </section>

            <section>
                <h2>How to contact us</h2>
                <p>
                    For questions about these Terms or your rights:{" "}
                    <a href="mailto:manilasbkzoverdose@gmail.com">manilasbkzoverdose@gmail.com</a>
                    . For urgent matters call +63 956 518 3562.
                </p>
            </section>

            <footer className="pt-8">
                {/* <p>
          <small>
            Note: This document is a template and does not constitute legal
            advice. We recommend that you have these Terms reviewed by legal
            counsel to ensure compliance with local regulations and
            industry-specific rules.
          </small>
        </p> */}
                <p className="mt-4">
                    <Link href="/">← Back to home</Link>
                </p>
            </footer>
        </main>
    );
}
