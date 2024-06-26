const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

export const generateImagesByIdol = async (idolName) => {
    try {
        const res = await fetch(`${BACKEND_BASE_URL}/images/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                idolName
            })
        });
    
        if (res.ok) {
            const allImagesJSON = await res.json();
            return allImagesJSON;
        } else if (res.status === 404) {
            const messageJSON = await res.json();
            return messageJSON;
        }
    } catch (err) {
        return null;
    }
}

export const getAllImages = async () => {
    const allImagesRes = await fetch(`${BACKEND_BASE_URL}/images/`);
    
    let allImages;
    if (allImagesRes.ok) {
        allImages = await allImagesRes.json();
    }

    return allImages.images
}

export const getAllIdolNames = async () => {
    const allIdolNamesRes = await fetch(`${BACKEND_BASE_URL}/images/names`);

    if (allIdolNamesRes.ok) {
        const allIdolNames = await allIdolNamesRes.json();
        return allIdolNames.idolNames;
    } else {
        return null;
    }
}

export const getIdolImagePair = async () => {
    const imagePairRes = await fetch(`${BACKEND_BASE_URL}/images/random`);

    if (imagePairRes.ok) {
        const imagePair = await imagePairRes.json();
        return imagePair.images;
    } else {
        return null;
    }
}

export const getIdolImagePairByIdol = async (idolName) => {
    const imagePairRes = await fetch(`${BACKEND_BASE_URL}/images/random/${idolName}`);

    if (imagePairRes.ok) {
        const imagePair = await imagePairRes.json();
        return imagePair.images;
    } else {
        return null;
    }
}

export const likeImage = async (firstImageID, secondImageID, chosenID) => {
    const res = await fetch(`${BACKEND_BASE_URL}/images/like`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            firstImageID,
            secondImageID,
            chosenID
        })
    });

    if (res.ok) {
        const resJSON = await res.json();
        return resJSON;
    }  else {
        return null;
    }
}