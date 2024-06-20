import { getImagesByIdol } from "../requests/images.js"
import Image from "../models/Image.js";

export const generateImagesByIdol = async (req, res) => {
    try {
        const { idolName } = req.body;

        const imageObjects = await getImagesByIdol(idolName);

        if (!imageObjects) {
            res.status(404).json({ message: "Idol doesn't exist!" })
        }

        let imagesAdded = 0;
        imageObjects.forEach(async (imageObject) => {
            const imageAlreadyExists = Boolean(await Image.exists({ title: imageObject.title }));
            if (!imageAlreadyExists) {
                const newImage = await new Image(imageObject)
                await newImage.save();
                imagesAdded++;
            }
        })

        const allImageObjects = await Image.find();

        res.status(201).json({ allImages: allImageObjects, imagesAdded })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export const deleteIdol = async (req, res) => {
    try {
        const { idolName } = req.body;

        const imagesDeleted = await Image.deleteMany({ idolName });
        const newImageObjects = await Image.find();

        res.status(200).json({allImages: newImageObjects, imagesDeleted: imagesDeleted.length})
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export const getAllImages = async (req, res) => {
    try {
        const allImages = await Image.find();
        res.status(200).json({ images: allImages })
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

// export const getRandomImagePairs = async (req, res) => {
//     const { idolName } 
//     // get all images of one idol --> array

//     // create random sets of two images for that one idol --> array of arrays
// }

export const getRandomImagePair = async (req, res) => {
    try {
        const allIdolNames = await Image.find().distinct("idolName");

        const randIndex = Math.floor(Math.random() * allIdolNames.length);
        const randomIdolName = allIdolNames[randIndex];

        // get all images of one idol --> array
        const allIdolImages = await Image.find({ idolName: randomIdolName });

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
        const { idolName } = req.query

        // get all images of one idol --> array
        const allIdolImages = await Image.find({ idolName });

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

        const firstImage = await Image.findById(firstImageID);
        const secondImage = await Image.findById(secondImageID);

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

        const updatedFirstImage = await Image.findByIdAndUpdate(
            firstImageID,
            {
                score: firstScore,
                numWins: firstWins,
                numLosses: firstLosses
            },
            { new: true }
        )

        const updatedSecondImage = await Image.findByIdAndUpdate(
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

const getNewRating = (myRating, opponentRating, outcome) => {
    return myRating + getRatingDelta(myRating, opponentRating, outcome)
}

const getRatingDelta = (myRating, opponentRating, outcome) => {
    if ([0, 0.5, 1].indexOf(outcome) === -1) {
        return null;
    }

    const myChanceToWin = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
    return Math.round(32 * (outcome - myChanceToWin))
}