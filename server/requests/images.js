import axios from "axios";

// returns an array of Image objects
export const getImagesByIdol = async (idolName) => {
    const res = await axios.request({
        method: "POST",
        url: `${process.env.WEBSCRAPING_BASE_URL}/scraper`,
        headers: {
            "content-type": "application/json"
        },
        data: {
            idolName
        }   
    })

    console.log(res.status);
    if (res.status === 404) {
        return null;
    }

    const data = res.data();

    return data.albums.map((album) => {
        const originUrl = album.url;
        const title = album.title;

        let imageObjects = album.pictureURLs.map(((imageUrl, index) => {
            return {
                originUrl,
                imageUrl,
                idolName,
                title,
                imageName: `${title} picture ${index}`,
                score: 1500,
                numWins: 0,
                numLosses: 0
            }
        }))

        return imageObjects
    })
}   