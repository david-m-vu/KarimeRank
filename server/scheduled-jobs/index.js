import Image from "../models/Image.js";
import TestImage from "../models/TestImage.js";
import ArchivedImage from "../models/ArchivedImage.js";
import { getImagesByIdol } from "../requests/images.js"
import { isValidImageUrl } from "../util/index.js";
import { kpopGroups } from "../idol-data/index.js";
import probe from "probe-image-size";

import schedule from "node-schedule";

let idolsToGen = []

// idolsToGen.push(...kpopGroups.aespaMembers);
// idolsToGen.push(...kpopGroups.illitMembers);
// idolsToGen.push(...kpopGroups.iveMembers);
// idolsToGen.push("Yena2", "Yuri2");

// node schedule
const job = schedule.scheduleJob("0 0 1 * *", async () => {
    console.log("image reset starting!")
    await archiveImages();
    await generateNewImageSet(idolsToGen);
})

const generateNewImageSet = async (idolsToGen) => {
    let imagesAdded = 0;
    const newImagesSet = [];

    for (const idolName of idolsToGen) {
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
 
    console.log(`idols added: ${idolsToGen}\nimages added: ${imagesAdded}`);
 }

const archiveImages = async () => {
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        const archivedImages = moveDocuments(model, ArchivedImage);
        if (!archivedImages) {
            console.log("move didn't work, error")
        }

        console.log("successfully archived!");
    } catch (err) {
        console.log(err.message);
    }
}

const moveDocuments = async (SourceCollection, DestinationCollection) => {
    try {
        const images = await SourceCollection.find();
        await DestinationCollection.insertMany(images);
        await SourceCollection.deleteMany({});

        console.log("moved documents successfully");
        const archivedImages = await DestinationCollection.find();
        return archivedImages
    } catch (err) {
        return null;
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

// const deleteIdol = async (idolName) => {
//     try {
//         const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

//         const imagesDeleted = await model.deleteMany({ idolName: new RegExp(`^${idolName}$`, 'i') });
//         const newImageObjects = await model.find();

//         console.log("SUCCESS DAVE")
//     } catch (err) {
//         console.log("what", err.message);
//     }
// }