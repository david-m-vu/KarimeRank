const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

export const getAllImages = async () => {
    const allImagesRes = await fetch(`${BACKEND_BASE_URL}/images/`);
    let allImages;
    
    if (allImagesRes.ok) {
        allImages = await allImagesRes.json();
    }

    return allImages.images
}