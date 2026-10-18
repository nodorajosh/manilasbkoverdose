import Artists from "./artists";
import Closing from "./closing";
import Hero from "./hero";
import Preface from "./preface";
import Trailer from "./trailer";

export default function Home() {
    return (
        <>
            <Hero />
            <Preface />
            <Trailer />
            <div aria-hidden="true" className="relative isolate h-32 overflow-hidden bg-[#0d0a12]">
                <div className="absolute -top-24 left-1/2 h-48 w-[135%] -translate-x-1/2 rounded-[50%] border-t border-[#f3d78a]/20 bg-[#17101f] shadow-[0_-24px_80px_rgba(91,35,112,.28)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f3d78a]/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#0d0a12]" />
            </div>
            <Artists />
            <Closing />
        </>
    );
}
