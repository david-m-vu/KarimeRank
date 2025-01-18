import Image from "../models/Image.js";
import TestImage from "../models/TestImage.js";
import ArchivedImage from "../models/ArchivedImage.js";
import { getImagesByIdol } from "../requests/images.js"
import { isValidImageUrl } from "../util/index.js";
import probe from "probe-image-size";

import schedule from "node-schedule";

let idolsToGen = []
const aespaMembers = ["karina2", "winter", "ningning", "giselle"];
const newjeansMembers = ["hanni", "haerin2", "minji11", "danielle", "hyein4"];
const kissMembers = ["belle", "natty", "haneul9", "julie3"]
const illitMembers = ["wonhee", "yunah", "iroha", "moka", "Minju6"]

idolsToGen.push(...aespaMembers);
idolsToGen.push(...newjeansMembers);
idolsToGen.push(...kissMembers);
idolsToGen.push(...illitMembers);
idolsToGen.push("Yena2", "Yuri2");

// node schedule
const job = schedule.scheduleJob("0 0 18 1 *", async () => {
    await archiveImages();
    await generateNewImageSet(idolsToGen);
})

const generateNewImageSet = async (idolsToGen) => {
    let imagesAdded = 0;
    const newImagesSet = [];

    const timer = ms => new Promise(res => setTimeout(res, ms))

    for (const idolName of idolsToGen) {
        const imageObjects = await getImagesByIdol(idolName.toLowerCase());

        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;

        if (!imageObjects) {
            console.log(`Idol ${idolName} doesn't exist!`)
        }

        await imageObjects.forEach(async (imageObject) => {
            const imageAlreadyExists = Boolean(await model.exists({ title: imageObject.title }));
            if (!imageAlreadyExists) {
                // console.log(imageObject);
                let { groupName } = imageObject;
                if (!groupName) {
                    groupName = "N/A"
                }

                // get dimensions
                const { imageUrl } = imageObject;

                let imageMetadata
                const isValidImage = await isValidImageUrl(imageUrl);

                if (isValidImage) {
                    imageMetadata = await probe(imageUrl);
                    if (imageMetadata) {
                        const { width, height } = imageMetadata;

                        const newImage = await new model({ ...imageObject, groupName, width, height });
                        await newImage.save();
                        imagesAdded++;
                    }
                }
            }
        })

        console.log(idolName, "added")

        const allImageObjects = await model.find();
        newImagesSet.push(allImageObjects);

        await timer(20000);
    }
 
    console.log(`idols added: ${idolsToGen}\n
        images added: imagesAdded`);
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

        console.log("poggers");
        const archivedImages = await DestinationCollection.find();
        return archivedImages
    } catch (err) {
        return null;
    }
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