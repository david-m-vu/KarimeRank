import { storage } from './firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// uploads a file into the storage and returns the 1 for image add, 0 for exist. Also edits the imageObj to have the downloadUrl as the url attribute
export const uploadImage = async (fileBuffer, filePath, imageObj) => {
    const existingUrl = await fileExists(filePath);

    if (existingUrl) {
        // since imageObj will always be coming from the webscraper result, it will never have the firebase url.
        // as a result, we always need to set the url even if the image in the storage already exists so that we 
        // can successfully return the imageObj from the controller
        imageObj.url = existingUrl;
        return 0; // return 0 to indicate that no image was added
    }
    
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, fileBuffer);
    const downloadURL = await getDownloadURL(storageRef);

    imageObj.url = downloadURL;
    return 1; // return 1 to indicate that 1 image was added
}

const fileExists = async (filePath) => {
    try {
        const storageRef = ref(storage, filePath);
        const url = await getDownloadURL(storageRef); // if this succeeds, the file exists
        return url;
    } catch (error) {
        if (error.code === "storage/object-not-found") {
            return null; // file does not exist
        }
        throw error; // some other error occured
    }
}