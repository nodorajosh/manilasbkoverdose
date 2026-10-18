import assert from "node:assert/strict";
import test from "node:test";

import { assetStem, isMainArtistsCategory, lineupSlot, sortArtistImages } from "./artist-lineup";

test("asset stem keeps the Cloudinary display name", () => {
    assert.equal(assetStem("mnl-sbkz/artists/2027/Main Artists/2027_1.png"), "2027_1");
    assert.equal(assetStem("2027_1"), "2027_1");
});

test("main artists category names normalize", () => {
    assert.equal(isMainArtistsCategory("Main Artists"), true);
    assert.equal(isMainArtistsCategory("main_artists"), true);
    assert.equal(isMainArtistsCategory("DJs"), false);
});

test("2027_1 is slot 1 for the 4th edition year", () => {
    assert.equal(lineupSlot(["2027_1"], "2027"), 1);
    assert.equal(lineupSlot(["2027-1.jpg"], "2027"), 1);
    assert.equal(lineupSlot(["2027_10"], "2027"), 10);
    assert.equal(lineupSlot(["2026_1"], "2027"), null);
});

test("newest 2027_1 image leads Main Artists", () => {
    const images = [
        { public_id: "older-headliner", display_name: "posted-first", created_at: "2026-01-01T00:00:00Z" },
        { public_id: "random-id", display_name: "2027_2", created_at: "2026-06-01T00:00:00Z" },
        { public_id: "cld-upload", display_name: "2027_1", created_at: "2026-12-01T00:00:00Z" },
        { public_id: "mnl-sbkz/artists/2027/Main Artists/2027_10.jpg", created_at: "2026-02-01T00:00:00Z" },
    ];

    const ordered = sortArtistImages(images, "2027", "Main Artists").map((image) => image.public_id);

    assert.deepEqual(ordered, [
        "cld-upload",
        "random-id",
        "mnl-sbkz/artists/2027/Main Artists/2027_10.jpg",
        "older-headliner",
    ]);
});

test("other categories stay in created_at order", () => {
    const images = [
        { public_id: "first", display_name: "2027_9", created_at: "2026-01-01T00:00:00Z" },
        { public_id: "second", display_name: "2027_1", created_at: "2026-05-01T00:00:00Z" },
    ];

    const ordered = sortArtistImages(images, "2027", "DJs").map((image) => image.public_id);

    assert.deepEqual(ordered, ["first", "second"]);
});
