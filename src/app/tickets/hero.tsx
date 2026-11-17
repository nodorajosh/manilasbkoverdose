import Image from "next/image";
import Link from "next/link";
import ArrowIcon from "@/components/arrow-icon";
import HeroBG from "../../assets/images/tickets_hero.jpg";

export default function Hero() {
    return (
        <section className="ticket-hero relative isolate overflow-hidden bg-ink">
            <Image src={HeroBG.src} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-70" />
            <div className="hero-shade absolute inset-0" />
            <div className="relative mx-auto flex min-h-[38rem] w-full max-w-[100rem] flex-col justify-end px-5 pb-10 pt-32 sm:px-8 sm:pb-14 lg:px-12">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 border-t border-white/40 pt-4 text-sm text-white/75">
                    <Link href="/" className="text-link">Manila SBKZ Overdose</Link>
                    <span aria-hidden="true">/</span>
                    <span aria-current="page" className="text-white">Tickets</span>
                </nav>
                <h1 className="mt-8 font-header text-6xl uppercase leading-[.86] text-gold sm:text-8xl lg:text-9xl">Get in.<br />Get down.</h1>
                <div className="mt-8 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                    <p className="max-w-lg text-lg leading-8 text-white">Pick your pass, set your quantity, and make your way to the floor.</p>
                    <a href="#ticket-catalog" className="cta cta-solid w-fit px-6 py-4 text-sm">Choose your pass <ArrowIcon direction="down" /></a>
                </div>
            </div>
        </section>
    );
}
