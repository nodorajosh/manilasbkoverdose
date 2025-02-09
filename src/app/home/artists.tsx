import fs from 'fs'
import path from 'path'

import ArtistsPageComponent from "./artists.components/artists-page.component";

const dir = path.resolve('./public/images/artists');
let imageObject: {
    [key: string]: {
        [key: string]: string[];
        // "Main Artists": string[];
        // "Additional International Artists": string[];
        // "Local Artists": string[];
        // "Performers": string[];
        // "DJs": string[];
        // "Ambassadors": string[];
        // "Hosts": string[];
        // "Event Organizers": string[];
        // "collage": string | undefined;
    };
} = {}
// let images: any = []

fs.readdirSync(dir).forEach((year) => {
    const innerDir = path.resolve("./public/images/artists/" + year);

    imageObject = {
        ...imageObject,
        [year]: {
            "Main Artists": [],
            "Additional International Artists": [],
            "Local Artists": [],
            "Performers": [],
            "DJs": [],
            "Ambassadors": [],
            "Hosts": [],
            "Event Organizers": [],
            // "collage": undefined
        }
    }

    fs.readdirSync(innerDir).forEach((category) => {

        if (category.split(".")[0] === "collage") {

            // imageObject = { ...imageObject, [year]: { ...imageObject[year], collage: "/images/artists/" + year + "/" + category } }

        } else {

            const innerInnerDir = path.resolve("./public/images/artists/" + year + "/" + category);

            imageObject = { ...imageObject, [year]: { ...imageObject[year], [category]: [] } }

            fs.readdirSync(innerInnerDir).forEach((image: string) => {
                if (typeof imageObject[year][category] === "object") {
                    imageObject[year][category].push("/images/artists/" + year + "/" + category + "/" + image)
                }
            })

        }
    })
})



// const images = filenames.map(name => path.join('/', dirRelativeToPublicFolder, name))

// console.log(filenames)

export default function Artists() {

    return (
        <ArtistsPageComponent imageObject={imageObject} />
    );
}
