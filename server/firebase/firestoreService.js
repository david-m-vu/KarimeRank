import { db } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";

// Save one imageObj to Firestore
export const saveImage = async (collectionName, imageObj) => {
    try {
        const collectionRef = collection(db, collectionName);

        // check if an image with the same imageName already exists
        const q = query(collectionRef, where("imageName", "==", imageObj.imageName));
        const existingDocs = await getDocs(q);
    
        if (!existingDocs.empty) {
            // console.log(`Skipping duplicate: image with imageName ${imageObj.imageName} already exists`);
            return null;
        }
    
        imageObj.createdAt = Timestamp.now();
    
        const imageRef = await addDoc(collectionRef, imageObj);
        return { id: imageRef.id, ...imageObj } ;
    } catch (err) {
        console.log(err.message);
        return null;
    }
}

// Save multiple imageObj to firestore
export const saveManyImages = async (collectionName, imageObjects) => {
    try {
        const collectionRef = collection(db, collectionName);
        const addedImages = [];
    
        // existingDocsQuery.docs returns an array of all the docs, which all contain the .data attribute
        const existingDocsQuery = await getDocs(collectionRef);
        const existingDocsData = existingDocsQuery.docs.map((doc) => doc.data());
        const existingImageNames = new Set(existingDocsData.map((doc) => doc.imageName));
        const existingThumbnailUrls = new Set(existingDocsData.map((doc) => doc.thumbnailUrl));
    
        const savePromises = imageObjects.map(async (imageObj) => {
            if (existingImageNames.has(imageObj.imageName) || existingThumbnailUrls.has(imageObj.thumbnailUrl)) {
                // console.log(`Skipping duplicate: image with imageName ${imageObj.imageName} or thumbnailUrl ${thumbnailUrl} already exists`);
                return null;
            }
    
            imageObj.createdAt = Timestamp.now();
    
            const imageRef = await addDoc(collectionRef, imageObj);

            // so that we don't add duplicates within the same image input batch
            existingImageNames.add(imageObj.imageName);
            existingThumbnailUrls.add(imageObj.thumbnailUrl);
            return { id: imageRef.id, ...imageObj};
        })
    
        const results = await Promise.all(savePromises);

        // return just the images we've added
        return results.filter(image => image !== null); // filter out all the images that returned null due to already existing
        
    } catch (err) {
        console.log(err.message);
        return null;
    }
}
