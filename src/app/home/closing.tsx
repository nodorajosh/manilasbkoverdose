import Link from "next/link";

export default function Closing() {
    return (
        <section id="closing" className="relative overflow-hidden bg-[#09070d] px-5 py-24 text-white sm:px-8 sm:py-36 lg:px-12"><div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#7c3f9c]/20 blur-[110px]" /><div className="relative mx-auto max-w-4xl text-center"><p className="eyebrow text-[#bff4df]">The floor is waiting</p><h2 className="mt-5 text-5xl font-semibold leading-[.88] tracking-[-.07em] sm:text-8xl">Find your beat. Create your story.</h2><p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/60">Every class, every party, every song brings you closer to something bigger than dance. The lights are on. Step into them.</p><Link href="/tickets" className="cta cta-solid mt-9 inline-flex px-7 py-4 text-sm uppercase tracking-[.14em]">Join the festival</Link></div></section>
    );
}
