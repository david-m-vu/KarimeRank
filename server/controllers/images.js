import { db } from "../firebase/firebaseConfig.js";
import { doc, collection, getDocs, getAggregateFromServer, sum, limit, orderBy, startAfter, query, where, runTransaction, deleteDoc } from "firebase/firestore"
import axios from "axios";

import { saveManyImages } from "../firebase/firestoreService.js";
import { uploadImage } from "../firebase/storageService.js";

import { getImagesByIdol } from "../requests/images.js"
import { isValidImageUrl, getNewRating, moveDocuments, sanitizeFileName } from "../util/index.js";
import { kpopGroups } from "../idol-data/index.js";

import Image from "../models/Image.js";
import TestImage from "../models/TestImage.js";
import ArchivedImage from "../models/ArchivedImage.js";

import https from "https";
import probe from "probe-image-size";

const httpAgent = new https.Agent({ keepAlive: true }); 

const client = axios.create({
    timeout: 15000,
    httpsAgent: httpAgent,
    headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://kpopping.com/",
        "Upgrade-Insecure-Requests": "1", // "I prefer HTTPS versions", make header set look more browser-like
    }
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchImageBufferWithRetry = async ({ originUrl, thumbnailUrl, maxAttempts = 3 }) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await client({
                method: "GET",
                url: thumbnailUrl,
                responseType: "stream",
                headers: {
                    Referer: originUrl
                }
            });

            // response.data is a ReadableStream of image bytes
            // need to read it as an iterable because each chunk is just whatever bytes have arrived so far from the network
            // can't just grab the whole ile in one shot from the stream - have to read it chunk by chunk until the stream ends
            const chunks = [];
            for await (const chunk of response.data) {
                chunks.push(chunk);
            }

            // join the chunks into a single buffer
            // note we can't really use array.join because Buffer is designed specifically for binary data
            return Buffer.concat(chunks);
        } catch (err) {
            lastError = err;
            console.warn(`Attempt ${attempt} failed for ${thumbnailUrl}: ${err.message}`);
            if (attempt < maxAttempts) {
                await wait(500 * attempt);
            }
        }
    }

    throw lastError;
};

const saveIdolImages = async (idolName, collectionName, imageObjects) => {
    const uploadPromises = imageObjects.map(async (imageObj) => {
        const { originUrl, thumbnailUrl, imageName } = imageObj;
        try {
            const buffer = await fetchImageBufferWithRetry({ originUrl, thumbnailUrl });

            // upload image to firebase storage
            const added = await uploadImage(
                buffer,
                `${collectionName}/${idolName}/${sanitizeFileName(imageName)}.jpeg`,
                imageObj
            );

            // attach dimensions
            const metadataSource = imageObj.url || thumbnailUrl;
            if (metadataSource) {
                try {
                    const imageMetadata = await probe(metadataSource);
                    if (imageMetadata) {
                        const { width, height } = imageMetadata;
                        imageObj.width = width;
                        imageObj.height = height;
                    }
                } catch (metadataErr) {
                    console.warn(`Failed to probe metadata for ${imageName}:`, metadataErr.message);
                }
            }

            return added;
        } catch (err) {
            console.error(`Failed to upload ${imageName} with url ${thumbnailUrl}:`, err);
            return null;
        }
    });

    const results = await Promise.all(uploadPromises);
    const imagesAddedCount = results.reduce((partialSum, cur) => partialSum + (cur || 0), 0);

    await saveManyImages(collectionName, imageObjects);
    console.log(`Added ${imagesAddedCount} images for ${idolName}`);

    return imagesAddedCount;
};

// Firebase version (admin)
export const generateImagesByIdol = async (req, res) => {
    try {
        const { idolName } = req.body;
        const idolLower = idolName.toLowerCase();
        const imageObjects = await getImagesByIdol(idolLower);
        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";

        const imagesAddedCount = await saveIdolImages(
            idolLower,
            collectionName,
            imageObjects
        );

        return res.status(201).json({ allImages: imageObjects, imagesAdded: imagesAddedCount});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

// Firebase version (admin)
export const generateImageSet = async (req, res) => {
    const { kpopGroupsToGen, individualIdols } = req.body;

    if (!kpopGroupsToGen || kpopGroupsToGen.length === 0) {
        return res.status(200).json({ message: "No valid kpop groups in request", newImagesSet: [], imagesAdded: 0 });
    }

    const idolsToGen = []
    for (const kpopGroup of kpopGroupsToGen) {
        idolsToGen.push(...(kpopGroups[kpopGroup] || []));
    }

    if (individualIdols) {
        idolsToGen.push(...individualIdols)
    }

    const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";

    try {
        let totalImagesAddedCount = 0;
        let newImagesSet = [];
        for (const idolName of idolsToGen) {
            console.log(`Generating images for ${idolName}...`);
            const idolLower = idolName.toLowerCase();
            const imageObjects = await getImagesByIdol(idolLower);

            const imagesAddedCount = await saveIdolImages(
                idolLower,
                collectionName,
                imageObjects
            );

            totalImagesAddedCount += imagesAddedCount;
            newImagesSet.push(imageObjects);
        }

        return res.status(201).json({ newImagesSet, imagesAdded: totalImagesAddedCount })

    } catch (err) {
        console.error("Unexpected error in generateImageSet:", err);
        res.status(500).json({message: err.message});
    }
}

// firebase version
export const getTotalVotes = async (req, res) => {
    try {
        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";
        const imagesRef = collection(db, collectionName);

        const snapshot = await getAggregateFromServer(imagesRef, {
            totalVotes: sum("numWins")
        })
        
        res.status(200).json({ totalVotes: snapshot.data().totalVotes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// admin function
export const updateAllIdols = async (req, res) => {
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const allIdolNames = await model.find().distinct("idolName");

        allIdolNames.forEach(async () => {
            const imageObjects = await getImagesByIdol(idolName.toLowerCase());

            if (!imageObjects) {
                return res.status(404).json({ message: "An idol doesn't exist!" })
            }

            let imagesAdded = 0;
            imageObjects.forEach(async (imageObject) => {
                const imageAlreadyExists = Boolean(await model.exists({ imageName: imageObject.imageName }));
                if (!imageAlreadyExists) {
                    const newImage = await new model(imageObject);
                    await newImage.save();
                    imagesAdded++;
                }
            })
        })

        const allImageObjects = await model.find();

        res.status(200).json({ allImages: allImageObjects, imagesAdded });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

// admin function (firebase version)
export const deleteIdol = async (req, res) => {
    const { idolName } = req.body;
    if (!idolName) {
        return res.status(400).json({ message: "idolName is required" });
    }

    const normalizedIdolName = idolName.toLowerCase();
    const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";

    try {
        const imagesRef = collection(db, collectionName);
        const idolQuery = query(imagesRef, where("idolName", "==", normalizedIdolName));
        const snapshot = await getDocs(idolQuery);

        if (snapshot.empty) {
            return res.status(200).json({ message: `No images found for idol ${idolName}`, imagesDeleted: 0 });
        }

        await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));

        return res.status(200).json({
            message: `Deleted ${snapshot.size} images for ${idolName}`,
            imagesDeleted: snapshot.size
        });
    } catch (err) {
        console.error("Failed to delete idol from Firestore:", err);
        res.status(500).json({ message: err.message });
    }
};

// admin function (mongoose)
export const deleteImageById = async (req, res) => {
    try {
        const { _id } = req.body;

        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const deletedImage = await model.findByIdAndDelete(_id);
        if (!deletedImage) {
            res.status(404).json({ message: "Image not found" });
        }
        // // check this out next time
        // console.log("deletedImage:", deletedImage);


        res.status(200).json({ deletedImage })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// firebase version
export const getAllImages = async (req, res) => {
    try {
        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";
        const docSnapshot = await getDocs(collection(db, collectionName));
        const images = docSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data()}));

        res.status(200).json({ images });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// firebase version
export const getStartToEndImages = async (req, res) => {
    try {
        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";
        const { idolname, count, lastdocid } = req.query;

        const imagesRef =  collection(db, collectionName);
        let q;

        // if not passed an idolname, query all idols
        if (idolname) {
            q = query(imagesRef, where("idolName", "==", idolname), orderBy("score", "desc"), limit(count));
        } else {    
            q = query(imagesRef, orderBy("score", "desc"), limit(count));
        }

        // if lastDocId is provided, use it as a pagination cursor
        if (lastdocid) {
            const lastDocSnapshot = await getDocs(query(imagesRef, where("__name__", "==", lastdocid)));

            // there should only be one document
            if (!lastDocSnapshot.empty) {
                const lastDoc = lastDocSnapshot.docs[0];
                q = query(q, startAfter(lastDoc));
            }
        }

        // execute query
        const snapshot = await getDocs(q);
        if (snapshot.empty) { // if there is no more images to return, potentially due to the pagination advancing
            return res.status(200).json({ images: [], lastDocId: null });
        }

        // extract images and last document for next pagination request
        const images = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1]; // get last document for pagination

        res.status(200).json({ images, lastDocId: lastVisible.id });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: err.message });
    }
}

// not very useful anymore
export const getAllIdolNames = async (req, res) => {
    try {
        const model = Image //(process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const allIdolNames = await model.find().distinct("idolName");

        res.status(200).json({ idolNames: allIdolNames });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

// Firebase version
export const getAllIdolNamesWithGroup = async (req, res) => {
    try {
        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";
        const imagesRef = collection(db, collectionName);
        const snapshot = await getDocs(imagesRef);

        if (snapshot.empty) {
            return res.status(200).json({ uniqueIdolGroups: [] });
        }

        // Extract and normalize idolName and groupName
        const idolGroups = new Set();
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.idolName && data.groupName) {
                const idolName = data.idolName.toLowerCase();
                const groupName = data.groupName.toLowerCase();
                idolGroups.add(`${idolName}|${groupName}`)
            }
        })

        // Convert Set into an array of objects
        const uniqueIdolGroups = Array.from(idolGroups).map((entry) => {
            // convert the string to an array and destructure the idolName and groupName
            const [ idolName, groupName ] = entry.split("|");
            return { idolName, groupName };
        })

        res.status(200).json({ uniqueIdolGroups });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Firebase version
export const getRandomImagePair = async (req, res) => {
    try {
        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";
        const imagesRef = collection(db, collectionName);

        // get all unique idol names
        const idolSet = new Set();
        const imagesDocs = await getDocs(imagesRef);

        if (imagesDocs.empty) {
            return res.status(500).json({ message: "There are no idol names currently in the database"})
        }

        imagesDocs.forEach((doc) => {
            const data = doc.data();
            if (data.idolName) {
                idolSet.add(data.idolName.toLowerCase()); // ensure uniqueness
            }
        });

        const allIdolNames = Array.from(idolSet);

        // pick a random idol
        const randIndex = Math.floor(Math.random() * allIdolNames.length);
        const randomIdolName = allIdolNames[randIndex];

        // get all images of the chosen idol
        const idolQuery = query(imagesRef, where("idolName", "==", randomIdolName));
        const idolDocs = await getDocs(idolQuery);

        const allIdolImages = idolDocs.docs.map((doc) => {
            return {
                id: doc.id,
                ...doc.data()
            }
        })

        if (allIdolImages.length < 2) {
            return res.status(500).json({ message: "Not enough images for this idol." });
        }

        // pick two random unique images of the chosen idol
        let firstIndex = Math.floor(Math.random() * allIdolImages.length);
        let secondIndex = Math.floor(Math.random() * allIdolImages.length);

        while (firstIndex === secondIndex) {
            secondIndex = Math.floor(Math.random() * allIdolImages.length);
        }

        const firstImage = allIdolImages[firstIndex];
        const secondImage = allIdolImages[secondIndex];
        res.status(200).json({ images: [firstImage, secondImage] })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Firebase version
export const getRandomImagePairByIdol = async (req, res) => {
    try {
        const { idolName } = req.params;
        
        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";
        const imagesRef = collection(db, collectionName);

        // get idol's images docs
        const idolQuery = query(imagesRef, where("idolName", "==", idolName.toLowerCase() ));
        const idolDocs = await getDocs(idolQuery);

        const allIdolImages = idolDocs.docs.map((doc) => {
            return {
                id: doc.id,
                ...doc.data()
            }
        })

        if (allIdolImages.length < 2) {
            return res.status(404).json({ message: "Not enough images for this idol." });
        }

        // pick two random unique images of the chosen idol
        let firstIndex = Math.floor(Math.random() * allIdolImages.length);
        let secondIndex = Math.floor(Math.random() * allIdolImages.length);

        while (firstIndex === secondIndex) {
            secondIndex = Math.floor(Math.random() * allIdolImages.length);
        }

        const firstImage = allIdolImages[firstIndex];
        const secondImage = allIdolImages[secondIndex];
        res.status(200).json({ images: [firstImage, secondImage] })
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: err.message })
    }
}

// Firebase version
export const likeImage = async (req, res) => {
    try {
        const {
            firstImageID,
            secondImageID,
            chosenID
        } = req.body;

        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";

        // the third argument is the firestore document ID, also known as __name__
        const firstDocRef = doc(db, collectionName, firstImageID);
        const secondDocRef = doc(db, collectionName, secondImageID);

        let updatedFirstImage = {};
        let updatedSecondImage = {};

        // in a set of atomic operations, either all of the operations succeed, or none of them are applied.
        // this eliminates the chance for race conditions, since we need to read AND write to a document at the same time
        // "if a transaction reads documents and another client modifies any of those documents, 
        // Cloud Firestore retries the transaction. This feature ensures that the transaction runs on up-to-date 
        // and consistent data."
        await runTransaction(db, async (transaction) => {
            // read both documents atomically
            const firstSnap = await transaction.get(firstDocRef);
            const secondSnap = await transaction.get(secondDocRef);

            if (!firstSnap.exists()) {
                throw new Error("First image not found)");
            }
            if (!secondSnap.exists()) {
                throw new Error("Second image not found");
            }

            // extract data from each doc
            let { score: firstScore, numWins: firstWins, numLosses: firstLosses } = firstSnap.data();
            let { score: secondScore, numWins: secondWins, numLosses: secondLosses } = secondSnap.data();

            // update scores locally
            if (chosenID === firstImageID) {
                firstScore = getNewRating(firstScore, secondScore, 1);
                secondScore = getNewRating(secondScore, firstScore, 0);
                firstWins++;
                secondLosses++;
            } else if (chosenID === secondImageID) {
                firstScore = getNewRating(firstScore, secondScore, 0);
                secondScore = getNewRating(secondScore, firstScore, 1);
                secondWins++;
                firstLosses++;
            } else {
                throw new Error("Invalid chosenID");
            }

            // update both docs in the database in the same transaction
            transaction.update(firstDocRef, {
                score: firstScore,
                numWins: firstWins,
                numLosses: firstLosses
            });

            transaction.update(secondDocRef, {
                score: secondScore,
                numWins: secondWins,
                numLosses: secondLosses
            })

            // store updated data
            updatedFirstImage = {
                id: firstImageID,
                score: firstScore,
                numWins: firstWins,
                numLosses: firstLosses,
            };
            updatedSecondImage = {
                id: secondImageID,
                score: secondScore,
                numWins: secondWins,
                numLosses: secondLosses,
            };
        })

        res.status(200).json({ updatedFirstImage, updatedSecondImage });
    } catch (err) {
        res.status(404).json({ message: err.message })
    }
}

// (old) admin function
export const addGroupName = async (req, res) => {
    const { idolName, groupName } = req.body;

    const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

    const image = await model.updateMany({ idolName: new RegExp(`^${idolName}$`, 'i') }, { groupName })
    res.status(200).json({ image });
}

// debug function
export const addDimensions = async (req, res) => {
    // const testImageURL = "https://kpopping.com/documents/07/2/1176/240605-KISS-OF-LIFE-Twitter-Update-with-Natty-documents-1.jpeg?v=73ded"
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const allIdolNames = await model.find().distinct("idolName");

        const num = 40
        const idolImages = await model.find({ idolName: allIdolNames[num] });

        idolImages.forEach(async (imageObject) => {
            const { thumbnailUrl } = imageObject;

            // get dimensions of thumbnail that we will be rendering
            let imageMetadata
            const isValidImage = await isValidImageUrl(thumbnailUrl);

            if (isValidImage) {
                imageMetadata = await probe(thumbnailUrl);
                if (imageMetadata) {
                    const { width, height } = imageMetadata;
                    await model.findByIdAndUpdate(imageObject._id, { width, height });
                }
            }
        })

        res.status(200).json(await model.find({ idolName: allIdolNames[num] }));
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// admin function
export const archiveImages = async (req, res) => {
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const archivedImages = moveDocuments(model, ArchivedImage);
        if (!archivedImages) {
            res.status(500).json({ message: "move didn't work" })
        }

        res.status(200).json({ archivedImages })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// debug function
export const testAnything = async (req, res) => {
    try {
        console.log(process.env.TEST_MODE);
        console.log(process.env.TEST_MODE === "TEST_MODE")
        res.status(200).json({ message: "successssss" });
    } catch (err) {
        console.log(err.message);
    }
}
