import axios from "axios";

export const sanitizeFileName = (name) => {
    return name
        .replace(/\s+/g, "_")         // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_\-\.]/g, "") // Remove special characters except `_`, `-`, `.`
        .replace(/^\.+|\.+$/g, "");   // Remove leading/trailing dots
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


        console.log("poggers");
        const archivedImages = await DestinationCollection.find();
        return archivedImages
    } catch (err) {
        return null;
    }
}

export const getNewRating = (myRating, opponentRating, outcome) => {
    return myRating + getRatingDelta(myRating, opponentRating, outcome)
}

const getRatingDelta = (myRating, opponentRating, outcome) => {
    if ([0, 0.5, 1].indexOf(outcome) === -1) {
        return null;
    }

    const myChanceToWin = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
    return Math.round(32 * (outcome - myChanceToWin))
}
