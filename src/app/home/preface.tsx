import Link from "next/link";

export default function Preface() {
    return (
        <section id="preface" className="bg-[#f4eee4] px-5 py-20 text-[#17101f] sm:px-8 sm:py-28 lg:px-12">
            <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="eyebrow text-[#70416f]">A weekend for movement</p><h2 className="mt-4 max-w-xl text-5xl font-semibold leading-[.9] tracking-[-.06em] sm:text-7xl">Come for the rhythm. Stay for the people.</h2></div><div className="max-w-2xl"><p className="text-lg leading-8 text-[#3d3141]">Manila comes alive with Salsa, Bachata, Kizomba, and Zouk. For three exhilarating days, the festival becomes a playground of rhythm and connection, pairing world-class instruction with nights that refuse to slow down.</p><Link href="/tickets" className="cta cta-solid mt-8 inline-flex px-6 py-3.5 text-sm uppercase tracking-[.14em]">Find your place</Link></div></div>
        </section>
    );
}
