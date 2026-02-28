import axios from "axios";
import { getReservedNames, getBlockedTerms } from "../config/denylist.js";

const LEET_CHARACTER_MAP = Object.freeze({
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "8": "b",
    "9": "g",
    "@": "a",
    "$": "s",
    "!": "i",
});

const normalizeForDenylist = (value, { collapseRepeats = false } = {}) => {
    if (typeof value !== "string") {
        return "";
    }

    const lower = value
        .trim()
        .toLowerCase()
        .normalize("NFKD") // catches accented characters
        .replace(/[\u0300-\u036f]/g, ""); // removes the accent marks after normalize

    const leetNormalized = lower.replace(/[01345789@$!]/g, (char) => LEET_CHARACTER_MAP[char] || char);
    const alphanumericOnly = leetNormalized.replace(/[^a-z0-9]/g, "");

    if (!collapseRepeats) {
        return alphanumericOnly;
    }

    // Collapse long repeated characters so variants like "shiiiit" still match.
    return alphanumericOnly.replace(/(.)\1{2,}/g, "$1");
};

let cachedDenylistSignature = null;
let cachedReservedNames = Object.freeze(new Set());
let cachedNormalizedBlockedTerms = Object.freeze([]);

const getNormalizedDenylist = () => {
    const reservedNames = getReservedNames();
    const blockedTerms = getBlockedTerms();
    const signature = `${reservedNames.join(",")}|${blockedTerms.join(",")}`;

    // cache to avoid repeated work of parsing env lists and normalizing every time
    if (signature === cachedDenylistSignature) {
        return {
            reservedNames: cachedReservedNames,
            blockedTerms: cachedNormalizedBlockedTerms,
        };
    }

    cachedDenylistSignature = signature;
    cachedReservedNames = Object.freeze(new Set(reservedNames.map((value) => normalizeForDenylist(value))));
    // filter Boolean on string to avoid accidental universal matches on empty strings
    cachedNormalizedBlockedTerms = Object.freeze(blockedTerms.map((term) => normalizeForDenylist(term)).filter(Boolean)); 

    return {
        reservedNames: cachedReservedNames,
        blockedTerms: cachedNormalizedBlockedTerms,
    };
};

export const getDenylistMatch = (value) => {
    const normalized = normalizeForDenylist(value);
    const collapsedNormalized = normalizeForDenylist(value, { collapseRepeats: true });
    const denylist = getNormalizedDenylist();

    if (!normalized) {
        return null;
    }

    if (denylist.reservedNames.has(normalized) || denylist.reservedNames.has(collapsedNormalized)) {
        return "reserved_name";
    }

    for (const blockedTerm of denylist.blockedTerms) {
        if (normalized.includes(blockedTerm) || collapsedNormalized.includes(blockedTerm)) {
            return "blocked_term";
        }
    }

    return null;
};

export const sanitizeFileName = (name) => {
    return name
        .replace(/\s+/g, "_")         // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_\-\.]/g, "") // Remove special characters except `_`, `-`, `.`
        .replace(/^\.+|\.+$/g, "");   // Remove leading/trailing dots
}

export const isValidUsername = (username) => {
    if (typeof username !== "string") {
        return false;
    }
    return /^(?=.{3,20}$)[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/.test(username.trim())
}

export const isValidNickname = (nickname) => {
    if (typeof nickname !== "string") {
        return false;
    }
    return /^(?=.{2,30}$)[A-Za-z0-9]+(?:[ ._-][A-Za-z0-9]+)*$/.test(nickname.trim());
}

export const isValidImageUrl = async (url) => {
    try {
        // Perform a HEAD request to get headers only
        const response = await axios.head(url);

        // Check for successful response
        if (response.status !== 200) {
            console.log(`Error: Status code is ${response.status}`);
            return false;
        }

        // Validate content type
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
            console.log('Error: Content type is not an image');
            return false;
        }

        return true; // The URL is a valid image
    } catch (err) {
        return false;
    }
}

export const moveDocuments = async (SourceCollection, DestinationCollection) => {
    try {
        const images = await SourceCollection.find();
        await DestinationCollection.insertMany(images);
        await SourceCollection.deleteMany({});

        const archivedImages = await DestinationCollection.find();
        return archivedImages
    } catch (err) {
        return null;
    }
}

// outcome 1 means the my in myRating wins
// outcome 0 means the my in myRating loses
export const getNewRating = (myRating, opponentRating, outcome) => {
    return myRating + getRatingDelta(myRating, opponentRating, outcome)
}

const getRatingDelta = (myRating, opponentRating, outcome) => {
    if ([0, 0.5, 1].indexOf(outcome) === -1) {
        return null;
    }

    // opponent has more rating --> large denominator --> small chance to win --> more rating gained (if outcome === 1)
    // you have more rating --> small denominator --> large chance to win --> less rating gained (if outcome === 1)
    const myChanceToWin = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
    return Math.round(32 * (outcome - myChanceToWin))
}
