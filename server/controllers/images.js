import { db } from "../firebase/firebaseConfig.js";
import { collection, getDocs, getAggregateFromServer, sum, limit, orderBy, startAfter, query, where } from "firebase/firestore"
import axios from "axios";

import { saveManyImages } from "../firebase/firestoreService.js";
import { uploadImage } from "../firebase/storageService.js";

import { getImagesByIdol } from "../requests/images.js"
import { isValidImageUrl, getNewRating, moveDocuments, sanitizeFileName } from "../util/index.js";
import { kpopGroups } from "../idol-data/index.js";

import Image from "../models/Image.js";
import TestImage from "../models/TestImage.js";
import ArchivedImage from "../models/ArchivedImage.js";

import probe from "probe-image-size";

// Firebase version
export const generateImagesByIdol = async (req, res) => {
    try {
        const { idolName } = req.body;
        const imageObjects = await getImagesByIdol(idolName.toLowerCase());

        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_images" : "images";

        // Convert images to buffers and upload them in parallel
        const uploadPromises = imageObjects.map(async (imageObj) => {
            const { thumbnailUrl, imageName } = imageObj;
            try {
                const response = await axios({
                    method: "GET",
                    url: thumbnailUrl,
                    responseType: "stream"
                });
        
                const chunks = [];
                // response.data is a ReadableStream
                for await (const chunk of response.data) {
                    chunks.push(chunk);
                }

                // join the chunks into a single buffer
                // not we can't really use array.join because Buffer is designed specifically for binary data
                const buffer = Buffer.concat(chunks);
                const added = await uploadImage(buffer, `${collectionName}/${idolName}/${sanitizeFileName(imageName)}.jpeg`, imageObj);

                // // attach groupName
                // let { groupName } = imageObject;
                // if (!groupName) {
                //     groupName = "N/A"
                // }

                // attach dimensions
                const imageMetadata = await probe(imageObj.url);
                if (imageMetadata) {
                    const { width, height } = imageMetadata;
                    imageObj.width = width;
                    imageObj.height = height;
                }

                console.log(imageObj);

                return added;
            } catch (err) {
                console.error(`Failed to upload ${imageName}:`, err);
                return null; // Return null for failed uploads
            }
        });

        // imageObject was passed by reference, so newImageObjects is the same as imageObjects
        const imagesAdded = (await Promise.all(uploadPromises)).reduce((partialSum, a) => partialSum + a, 0);
        await saveManyImages(collectionName, imageObjects);

        return res.status(201).json({ allImages: imageObjects, imagesAdded});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

export const generateImageSet = async (req, res) => {
    let idolsToGen = []

    idolsToGen.push(...kpopGroups.aespaMembers);
    idolsToGen.push(...kpopGroups.illitMembers);
    idolsToGen.push(...kpopGroups.iveMembers);
    idolsToGen.push("Yena2", "Yuri2");

    let imagesAdded = 0;
    const newImagesSet = [];

    for (const idolName of idolsToGen) {
        console.log(`adding ${idolName}...`)
        const imageObjects = await getImagesByIdol(idolName.toLowerCase());

        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        if (!imageObjects) {
            console.log(`Idol ${idolName} doesn't exist!`)
        } else {
            imagesAdded += await createImagesSet(imageObjects);

            console.log(idolName, "added!")
    
            const allImageObjects = await model.find({ idolName });
            newImagesSet.push(allImageObjects);
        }
    }

    return res.status(200).json({ newImagesSet, imagesAdded });
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


export const deleteIdol = async (req, res) => {
    try {
        const { idolName } = req.body;

        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const imagesDeleted = await model.deleteMany({ idolName: new RegExp(`^${idolName}$`, 'i') });
        const newImageObjects = await model.find();

        res.status(200).json({ allImages: newImageObjects, imagesDeleted: imagesDeleted.length })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


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


export const getAllIdolNames = async (req, res) => {
    try {
        const model = Image //(process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const allIdolNames = await model.find().distinct("idolName");

        res.status(200).json({ idolNames: allIdolNames });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

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


// export const getRandomImagePairM = async (req, res) => {
//     try {
//         const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

//         const allIdolNames = await model.find().distinct("idolName");

//         if (allIdolNames.length === 0) {
//             res.status(500).json({ message: "There are no idol names currently in the database"})
//         }

//         const randIndex = Math.floor(Math.random() * allIdolNames.length);
//         const randomIdolName = allIdolNames[randIndex];

//         // get all images of one idol --> array
//         // const escapedName = escapeRegExp(randomIdolName);
//         const allIdolImages = await model.find({ idolName: new RegExp(`^${randomIdolName}$`, 'i') });

//         // create one random set of two images for that one idol --> array of 2
//         let firstIndex = Math.floor(Math.random() * allIdolImages.length);
//         let secondIndex = Math.floor(Math.random() * allIdolImages.length);

//         while (firstIndex === secondIndex) {
//             secondIndex = Math.floor(Math.random() * allIdolImages.length);
//         }

//         const firstImage = allIdolImages[firstIndex];
//         const secondImage = allIdolImages[secondIndex];
//         res.status(200).json({ images: [firstImage, secondImage] })
//     } catch {
//         res.status(500).json({ message: err.message });
//     }
// }

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


export const getRandomImagePairByIdol = async (req, res) => {
    try {
        const { idolName } = req.params;

        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;


        // get all images of one idol --> array
        // const escapedName = escapeRegExp(idolName);
        const allIdolImages = await model.find({ idolName: new RegExp(`^${idolName}$`, 'i') });


        // create one random set of two images for that one idol --> array of 2
        let firstIndex = Math.floor(Math.random() * allIdolImages.length);
        let secondIndex = Math.floor(Math.random() * allIdolImages.length);


        while (firstIndex === secondIndex) {
            secondIndex = Math.floor(Math.random() * allIdolImages.length);
        }


        const firstImage = allIdolImages[firstIndex];
        const secondImage = allIdolImages[secondIndex];
        res.status(200).json({ images: [firstImage, secondImage] })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const getRandomImagePairByIdolF = async (req, res) => {
    try {
        const { idolName } = req.params;
        
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


export const likeImage = async (req, res) => {
    try {
        const {
            firstImageID,
            secondImageID,
            chosenID
        } = req.body

        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const firstImage = await model.findById(firstImageID);
        const secondImage = await model.findById(secondImageID);

        let firstScore = firstImage.score;
        let firstWins = firstImage.numWins;
        let firstLosses = firstImage.numLosses;

        let secondScore = secondImage.score;
        let secondWins = secondImage.numWins;
        let secondLosses = secondImage.numLosses;

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
            res.status(400).json({ message: "invalid chosenID" })
        }


        const updatedFirstImage = await model.findByIdAndUpdate(
            firstImageID,
            {
                score: firstScore,
                numWins: firstWins,
                numLosses: firstLosses
            },
            { new: true }
        )


        const updatedSecondImage = await model.findByIdAndUpdate(
            secondImageID,
            {
                score: secondScore,
                numWins: secondWins,
                numLosses: secondLosses,
            },
            { new: true }
        )


        res.status(200).json({ updatedFirstImage, updatedSecondImage });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

export const addGroupNames = async (req, res) => {
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

export const testAnything = async (req, res) => {
    try {
        console.log(process.env.TEST_MODE);
        console.log(process.env.TEST_MODE === "TEST_MODE")
        res.status(200).json({ message: "successssss" });
    } catch (err) {
        console.log(err.message);
    }
}

const createImagesSet = async (imageObjects) => {
    let imagesAdded = 0;
    const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

    for (let imageObject of imageObjects) {
        const imageAlreadyExists = Boolean(await model.exists({ imageName: imageObject.imageName }));

        if (!imageAlreadyExists) {
            // console.log(imageObject);
            let { groupName } = imageObject;
            if (!groupName) {
                groupName = "N/A"
            }

            // get dimensions of thumbnail that we will be rendering
            const { thumbnailUrl } = imageObject;

            let imageMetadata
            const isValidImage = await isValidImageUrl(thumbnailUrl);

            if (isValidImage) {
                imageMetadata = await probe(thumbnailUrl);
                if (imageMetadata) {
                    const { width, height } = imageMetadata;

                    const newImage = await new model({ ...imageObject, groupName, width, height });
                    await newImage.save();

                    imagesAdded++;
                }
            }
        }
    }

    return imagesAdded;
}

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
