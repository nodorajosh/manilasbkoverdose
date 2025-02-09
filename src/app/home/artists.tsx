
import fs from 'fs'
import path from 'path'

import ArtistsPageComponent from "./artists.components/artists-page.component";

const dir = path.resolve('./public/images/artists');
let imageObject: any = {}
// let images: any = []
const years = fs.readdirSync(dir);

fs.readdirSync(dir).forEach((year) => {
    const innerDir = path.resolve("./public/images/artists/" + year);

    imageObject = { ...imageObject, [year]: {} }

    fs.readdirSync(innerDir).forEach((category) => {

        if (category.split(".")[0] === "collage") {

            imageObject = { ...imageObject, [year]: { ...imageObject[year], collage: "/images/artists/" + year + "/" + category } }

        } else {

            const innerInnerDir = path.resolve("./public/images/artists/" + year + "/" + category);

            imageObject = { ...imageObject, [year]: { ...imageObject[year], [category]: [] } }

            fs.readdirSync(innerInnerDir).forEach((image, index) => {
                imageObject[year][category][index] = "/images/artists/" + year + "/" + category + "/" + image
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
