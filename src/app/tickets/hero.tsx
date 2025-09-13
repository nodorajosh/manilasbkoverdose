import Image from "next/image";

import HeroBG from "../../assets/images/tickets_hero.jpg"

export default function Hero() {
    return (
        <div
            className="w-full text-white grid place-items-center"
        >
            <Image src={HeroBG.src} alt="Ignite the Night with Afro-Latin Rhythms in Manila" width={1920} height={480} style={{ width: '100%', height: 'auto' }} />

        </div>
    );
}
