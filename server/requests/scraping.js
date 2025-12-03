import axios from "axios";

/**
 * Returns an array of imageObjects scraped for a specific idol from WEBSCRAPING_BASE_URL.
 * Each image object has the shape:
 * {
 *   originUrl: string,      // Source page for the album on kpopping
 *   thumbnailUrl: string,   // Small preview image
 *   idolName: string,       // Idol the image belongs to
 *   groupName: string,      // Idol's group or "N/A" if they don't have one
 *   title: string,          // Album title
 *   imageName: string,      // Title + index-based label
 *   score: number,          // ELO score starting value
 *   numWins: number,        // Initial win count
 *   numLosses: number       // Initial loss count
 * }
 */
export const getImagesByIdol = async (idolName) => {
    const res = await axios.request({
        method: "POST",
        url: `${process.env.WEBSCRAPING_BASE_URL}/scraper`,
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            idolName
        }
    })

    if (res.data === "Idol doesn't exist") {
        return null;
    }

    const data = res.data;
    const groupName = data.groupName;

    // current scraper never returns no groupname
    if (!groupName) {
        groupName = "N/A"
    }

    const albumArr = data.albums.map((album) => {
        const originUrl = album.url;
        const title = album.title;

        let imageObjects = album.pictureURLs.map((imageObj, index) => {
            return {
                originUrl,
                thumbnailUrl: imageObj.thumbnailUrl,
                // imageUrl: imageObj.imageUrl,
                idolName,
                groupName,
                title,
                imageName: `${title} picture ${index}`,
                score: 1500,
                numWins: 0,
                numLosses: 0,
                // randomField: Math.random()
            }
        })

        return imageObjects;
    })

    const allImageObjects = albumArr.flat();
    return allImageObjects;
}