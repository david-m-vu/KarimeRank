import { getImagesByIdol } from "../requests/images.js"
import { isValidImageUrl, getNewRating, moveDocuments } from "../util/index.js";
import { kpopGroups } from "../idol-data/index.js";
import Image from "../models/Image.js";
import TestImage from "../models/TestImage.js";
import ArchivedImage from "../models/ArchivedImage.js";
import probe from "probe-image-size";

export const generateImagesByIdol = async (req, res) => {
    try {
        const { idolName } = req.body;
        const imageObjects = await getImagesByIdol(idolName.toLowerCase());

        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;
        let imagesAdded = 0;

        if (!imageObjects) {
            return res.status(404).json({ message: "Idol doesn't exist!" })
        } else {
            imagesAdded += await createImagesSet(imageObjects);
            console.log(idolName, "added!")    
        }

        const allImageObjects = await model.find();

        return res.status(201).json({ allImages: allImageObjects, imagesAdded })
    } catch (err) {
        return res.status(500).json({ message: err.message })
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

export const getTotalVotes = async (req, res) => {
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const result = await model.aggregate([
            {
                $group: {
                    _id: null,
                    totalVotes: { $sum: "$numWins" }
                }
            }
        ])

        if (result.length === 0) {
            res.status(404).json({ message: "no votes" });
        } else {
            res.status(200).json({ totalVotes: result[0].totalVotes })
        }
    } catch (err) {
        res.status(500).json({ message: err.message })
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
                const imageAlreadyExists = Boolean(await model.exists({ title: imageObject.title }));
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


export const getAllImages = async (req, res) => {
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;


        const allImages = await model.find();
        res.status(200).json({ images: allImages })
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}


export const getStartToEndImages = async (req, res) => {
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const { idolname, start, end } = req.query;

        let images;
        if (idolname) {
            images = await model.find({ idolName: new RegExp(`^${idolname}$`, 'i') }).sort({ score: -1, _id: 1 }).skip(start).limit(end - start);
        } else {
            images = await model.find().sort({ score: -1, _id: 1 }).skip(start).limit(end - start);
        }
        res.status(200).json({ images })
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}


// redundant
// export const getStartToEndImagesByIdol = async (req, res) => {
//     try {
//         const { idolName, start, end } = req.query;


//         const images = process.env.TEST_MODE === "TEST_MODE" ? await TestImage.find({ idolName }).sort({score: -1}).skip(start).limit(end - start) : await Image.find({ idolName }).sort({score: -1}).skip(start).limit(end - start);
//         res.status(200).json({ images: images })
//     } catch (err) {
//         res.status(404).json({ message: err.message });
//     }
// }


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
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;


        let uniqueIdolGroups;
        uniqueIdolGroups = await model.aggregate([
            {
                $project: {
                    idolName: { $toLower: "$idolName" },
                    groupName: { $toLower: "$groupName" }
                }
            },
            {
                $group: {
                    _id: { idolName: "$idolName", groupName: "$groupName" }
                }
            },
            {
                $project: {
                    _id: 0,
                    idolName: "$_id.idolName",
                    groupName: "$_id.groupName"
                }
            }
        ]);

        res.status(200).json({ uniqueIdolGroups });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}


export const getRandomImagePair = async (req, res) => {
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const allIdolNames = await model.find().distinct("idolName");

        if (allIdolNames.length === 0) {
            res.status(500).json({ message: "There are no idol names currently in the database"})
        }

        const randIndex = Math.floor(Math.random() * allIdolNames.length);
        const randomIdolName = allIdolNames[randIndex];

        // get all images of one idol --> array
        // const escapedName = escapeRegExp(randomIdolName);
        const allIdolImages = await model.find({ idolName: new RegExp(`^${randomIdolName}$`, 'i') });

        // create one random set of two images for that one idol --> array of 2
        let firstIndex = Math.floor(Math.random() * allIdolImages.length);
        let secondIndex = Math.floor(Math.random() * allIdolImages.length);

        while (firstIndex === secondIndex) {
            secondIndex = Math.floor(Math.random() * allIdolImages.length);
        }

        const firstImage = allIdolImages[firstIndex];
        const secondImage = allIdolImages[secondIndex];
        res.status(200).json({ images: [firstImage, secondImage] })
    } catch {
        res.status(500).json({ message: err.message });
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
