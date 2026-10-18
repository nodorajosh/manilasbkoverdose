import Image from "next/image";
import HeroBG from "../../assets/images/tickets_hero.jpg";

export default function Hero() {
    return (
        <section className="ticket-hero relative isolate overflow-hidden border-b border-white/10">
            <Image src={HeroBG.src} alt="Dancers moving through violet light at Manila SBKZ Overdose" fill priority sizes="100vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(8,5,12,.98)_8%,rgba(27,10,35,.78)_52%,rgba(8,5,12,.3)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(243,215,138,.25),transparent_25%)]" />
            <div className="relative mx-auto flex min-h-[31rem] w-full max-w-7xl flex-col justify-end px-5 pb-10 pt-32 sm:px-8 sm:pb-16 lg:min-h-[38rem] lg:px-12">
                <div className="max-w-3xl">
                    <p className="eyebrow text-[#f3d78a]">Manila SBKZ Overdose · tickets</p>
                    <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[.92] tracking-[-.06em] text-white sm:text-7xl">Your night starts here.</h1>
                    <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">One electric weekend. World-class artists, late-night socials, and a room built for movement.</p>
                </div>
                <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
                    <div className="border-l border-[#f3d78a]/70 pl-4"><span className="eyebrow text-[#f3d78a]">01</span><p className="mt-2 text-sm text-white/65">Choose your pass</p></div>
                    <div className="border-l border-[#f3d78a]/70 pl-4"><span className="eyebrow text-[#f3d78a]">02</span><p className="mt-2 text-sm text-white/65">Set your quantity</p></div>
                    <div className="border-l border-[#f3d78a]/70 pl-4"><span className="eyebrow text-[#f3d78a]">03</span><p className="mt-2 text-sm text-white/65">Own the moment</p></div>
                </div>
                <a href="#ticket-catalog" className="cta cta-solid mt-9 inline-flex w-fit px-6 py-3.5 text-sm uppercase tracking-[.14em]">Find your pass</a>
            </div>
        </section>
    );
}
