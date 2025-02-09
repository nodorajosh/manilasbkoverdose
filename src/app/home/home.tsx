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
            <Artists />
            <Closing />
        </>
    );
}
