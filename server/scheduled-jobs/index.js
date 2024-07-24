import Image from "../models/Image.js";
import TestImage from "../models/TestImage.js";
import ArchivedImage from "../models/ArchivedImage.js";

import schedule from "node-schedule";

// node schedule
// const job = schedule.scheduleJob("0 0 1 * *", () => {
//     console.log("HI")
// })
const job = schedule.scheduleJob("0 30 10 * * *", async () => {
    const newList = await deleteIdol();
})

const deleteIdol = async () => {
    try {
        const idolName = "lisa";
 
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;
 
        const imagesDeleted = await model.deleteMany({ idolName: new RegExp(`^${idolName}$`, 'i') });
        const newImageObjects = await model.find();
 
        console.log("SUCCESS DAVE")
    } catch (err) {
        console.log("what", err.message);
    }
}

const archiveImages = async (req, res) => {
    try {
        const model = (process.env.TEST_MODE === "TEST_MODE") ? TestImage : Image;
 
        const archivedImages = moveDocuments(model, ArchivedImage);
        if (!archivedImages) {
            res.status(500).json({ message: "move didn't work"})
        }
 
 
        res.status(200).json({ archivedImages })
    } catch (err) {
        res.status(500).json({ message: err.message });
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