// Node.js imports for filesystem and path utilities
import fs from 'fs'
import path from 'path'

// Importing the React component that will render the artists page
import ArtistsPageComponent from "./artists.components/artists-page.component";

// Absolute path to the root "artists" folder inside public/images
const dir = path.resolve('./public/images/artists');

// Type definition for the `imageObject` structure
// Each year (string key) contains an object with artist categories as keys
// Each category maps to an array of strings (image URLs)
let imageObject: {
    [key: string]: {
        [key: string]: string[];
        // Example categories (commented out since type is already flexible):
        // "Main Artists": string[];
        // "DJs": string[];
        // "Hosts": string[];
        // "collage": string | undefined; // optional special case
    };
} = {};

// Read all folders inside `/public/images/artists` (each folder is expected to be a "year")
fs.readdirSync(dir).forEach((year) => {
    const innerDir = path.resolve("./public/images/artists/" + year);

    // Initialize the year entry in `imageObject` with empty arrays for each category
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
            // "collage": undefined // left commented for now
        }
    }

    // Now read categories inside each year folder (e.g., "Main Artists", "DJs", etc.)
    fs.readdirSync(innerDir).forEach((category) => {

        // Handle the "collage" special case (disabled for now)
        if (category.split(".")[0] === "collage") {
            // If enabled, this would store a single image file path:
            // imageObject = { 
            //   ...imageObject, 
            //   [year]: { 
            //     ...imageObject[year], 
            //     collage: "/images/artists/" + year + "/" + category 
            //   } 
            // }
        } else {
            // Path to the inner folder (e.g., 2023/Main Artists/)
            const innerInnerDir = path.resolve("./public/images/artists/" + year + "/" + category);

            // Ensure the category exists as an empty array in that year
            imageObject = {
                ...imageObject,
                [year]: {
                    ...imageObject[year],
                    [category]: []
                }
            }

            // Read all images inside the category folder and push into the object
            fs.readdirSync(innerInnerDir).forEach((image: string) => {
                if (typeof imageObject[year][category] === "object") {
                    imageObject[year][category].push(
                        "/images/artists/" + year + "/" + category + "/" + image
                    );
                }
            });
        }
    });
});

// React component that renders the Artists page,
// passing the `imageObject` to the child component for display
export default function Artists() {
    return (
        <ArtistsPageComponent imageObject={imageObject} />
    );
}
