import axios from "axios";

// returns an array of Image objects
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

    // if (!groupName) {
    //     groupName = "N/A"
    // }

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