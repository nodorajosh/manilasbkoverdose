import Image from "next/image";
import Link from "next/link";
import ArrowIcon from "@/components/arrow-icon";
import CrowdBackground from "../../assets/images/manilasbk_hero_bg.png";

export default function Closing() {
    return (
        <section id="closing" className="relative isolate overflow-hidden bg-ink px-5 py-20 text-paper sm:px-8 sm:py-28 lg:px-12">
            <Image src={CrowdBackground} alt="" fill sizes="100vw" className="object-cover object-center" />
            <div className="hero-shade absolute inset-0" />
            <div className="relative mx-auto grid w-full max-w-[100rem] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                    <p className="mb-5 text-sm font-semibold uppercase tracking-[.12em] text-gold">June 4–6, 2027 · Manila</p>
                    <h2 className="section-title font-header uppercase">Ready to<br /><span className="text-gold">dance?</span></h2>
                    <p className="mt-7 max-w-xl text-xl font-medium leading-8 text-paper sm:text-2xl sm:leading-9">
                        Choose your pass for three days of workshops, shows and socials. We will see you on the floor.
                    </p>
                </div>
                <Link href="/tickets" className="cta cta-solid w-fit px-7 py-5 text-sm lg:mb-2">
                    Get your pass <ArrowIcon />
                </Link>
            </div>
        </section>
    );
}
