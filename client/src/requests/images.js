const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

export const generateImagesByIdol = async (idolName) => {
    // await fetch(`${BACKEND_BASE_URL}/images/`)
}

export const getAllImages = async () => {
    const allImagesRes = await fetch(`${BACKEND_BASE_URL}/images/`);
    
    let allImages;
    if (allImagesRes.ok) {
        allImages = await allImagesRes.json();
    }

    return allImages.images
}

export const getIdolImagePair = async () => {
    const imagePairRes = await fetch(`${BACKEND_BASE_URL}/images/random`);

    let imagePair
    if (imagePairRes.ok) {
        imagePair = await imagePairRes.json();
    }

    return imagePair.images;
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

    console.log(res);

    if (res.ok) {
        return await res.json();

    }  else {
        return null;
    }
}