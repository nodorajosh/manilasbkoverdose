import Link from "next/link";
import ArrowIcon from "@/components/arrow-icon";

const weekendFlow = [
    { timing: "Daytime", activity: "Workshops" },
    { timing: "Evening", activity: "Shows" },
    { timing: "Late night", activity: "Socials" },
    { timing: "All levels", activity: "Welcome" },
];

export default function Preface() {
    return (
        <section id="preface" className="bg-paper px-5 py-16 text-ink sm:px-8 sm:py-24 lg:px-12">
            <div className="mx-auto w-full max-w-[100rem]">
                <div className="grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
                    <h2 className="section-title font-header uppercase">
                        Learn it.<br /><span className="text-garnet">Dance it.</span>
                    </h2>
                    <div className="max-w-lg lg:pb-2">
                        <p className="text-xl font-medium leading-8 sm:text-2xl sm:leading-9">
                            Take a class, catch a performance, then put your own steps on the floor. Whatever your level, there is a place for you here.
                        </p>
                        <p className="mt-5 max-w-md text-base leading-7 text-ink/75">
                            June 4–6, 2027 in Manila. Come solo, bring your crew, or meet them here.
                        </p>
                        <Link href="/tickets" className="cta cta-dark mt-8 px-6 py-4 text-sm">
                            Choose your pass <ArrowIcon />
                        </Link>
                    </div>
                </div>

                <div className="dance-grid mt-16 grid border-y border-ink sm:grid-cols-2 lg:grid-cols-4">
                    {weekendFlow.map((item) => (
                        <h3 key={item.timing} className="border-ink py-5 text-xl font-semibold uppercase tracking-[-.02em] sm:px-5 sm:py-6">
                            <span className="block text-sm font-medium tracking-[.08em] text-ink/60">{item.timing}</span>
                            <span className="mt-1 block">{item.activity}</span>
                        </h3>
                    ))}
                </div>
            </div>
        </section>
    );
}
