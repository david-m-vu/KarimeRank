import { getImagesByIdol } from "../requests/images.js"
import Image from "../models/Image.js";
import probe from "probe-image-size";
import axios from "axios"

export const generateImagesByIdol = async (req, res) => {
    try {
        const { idolName } = req.body;
        const imageObjects = await getImagesByIdol(idolName.toLowerCase());

        if (!imageObjects) {
            return res.status(404).json({ message: "Idol doesn't exist!" })
        }

        let imagesAdded = 0;
        imageObjects.forEach(async (imageObject) => {
            const imageAlreadyExists = Boolean(await Image.exists({ title: imageObject.title }));
            if (!imageAlreadyExists) {
                // console.log(imageObject);
                let {groupName} = imageObject;
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
                        const newImage = await new Image({...imageObject, groupName, width, height});
                        await newImage.save();
                        imagesAdded++;
                    }    
                }
            }
        })

        const allImageObjects = await Image.find();

        return res.status(201).json({ allImages: allImageObjects, imagesAdded })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

export const getTotalVotes = async (req, res) => {
    try {
        const result = await Image.aggregate([
            {
                $group: {
                    _id: null,
                    totalVotes: { $sum: "$numWins" }
                }
            }
        ])

        res.status(200).json({totalVotes: result[0].totalVotes})
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export const updateAllIdols = async (req, res) => {
    try {
        const allIdolNames = await Image.find().distinct("idolName");

        allIdolNames.forEach(async () => {
            const imageObjects = await getImagesByIdol(idolName.toLowerCase());

            if (!imageObjects) {
                return res.status(404).json({ message: "An idol doesn't exist!" })
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
        })

        const allImageObjects = await Image.find();

        res.status(200).json({ allImages: allImageObjects, imagesAdded});
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

export const deleteIdol = async (req, res) => {
    try {
        const { idolName } = req.body;

        const imagesDeleted = await Image.deleteMany({ idolName: new RegExp(`^${idolName}$`, 'i') });
        const newImageObjects = await Image.find();

        res.status(200).json({allImages: newImageObjects, imagesDeleted: imagesDeleted.length})
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export const deleteImageById = async (req, res) => {
    try {
        const { _id } = req.body;

        const deletedImage = await Image.findByIdAndDelete( _id  );
        if (!deletedImage) {
            res.status(404).json({ message: "Image not found"});
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
        const allImages = await Image.find();
        res.status(200).json({ images: allImages })
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

export const getStartToEndImages = async (req, res) => {
    try {
        const { idolname, start, end } = req.query;

        let images;
        if (idolname) {
            images = await Image.find({ idolName: new RegExp(`^${idolname}$`, 'i') }).sort({ score: -1, _id: 1 }).skip(start).limit(end - start);
        } else {
            images = await Image.find().sort({ score: -1, _id: 1 }).skip(start).limit(end - start);
        }
        res.status(200).json({ images })
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}


export const getStartToEndImagesByIdol = async (req, res) => {
    try {
        const { idolName, start, end } = req.query;

        const images = await Image.find({ idolName }).sort({score: -1}).skip(start).limit(end - start);
        res.status(200).json({ images: images })
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}
export const getAllIdolNames = async (req, res) => {
    try {
        const allIdolNames = await Image.find().distinct("idolName");

        res.status(200).json({ idolNames: allIdolNames});
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

export const getAllIdolNamesWithGroup = async (req, res) => {
    try {
        const uniqueIdolGroups = await Image.aggregate([
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
        // const escapedName = escapeRegExp(randomIdolName);
        const allIdolImages = await Image.find({ idolName: new RegExp(`^${randomIdolName}$`, 'i') });


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

        // get all images of one idol --> array
        // const escapedName = escapeRegExp(idolName);
        const allIdolImages = await Image.find({ idolName: new RegExp(`^${idolName}$`, 'i') });

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

export const addGroupNames = async (req, res) => {
    const { idolName, groupName } = req.body;
    console.log(req.body);
    const image = await Image.updateMany({ idolName: new RegExp(`^${idolName}$`, 'i')}, { groupName })
    res.status(200).json({image});
}

const addDimensions = async (req, res) => {
    // const testImageURL = "https://kpopping.com/documents/07/2/1176/240605-KISS-OF-LIFE-Twitter-Update-with-Natty-documents-1.jpeg?v=73ded"
    try {
        const allIdolNames = await Image.find().distinct("idolName");
        
        const num = 40
        const idolImages = await Image.find({ idolName: allIdolNames[num]});

        idolImages.forEach(async (imageObject) => {
            const { imageUrl } = imageObject;

            let imageMetadata
            const isValidImage = await isValidImageUrl(imageUrl);

            if (isValidImage) {
                imageMetadata = await probe(imageUrl);
                if (imageMetadata) {
                    const { width, height } = imageMetadata;
                    await Image.findByIdAndUpdate(imageObject._id, { width, height } );
                }    
            } 
        })
    
        res.status(200).json(await Image.find({ idolName: allIdolNames[num] }));
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const isValidImageUrl = async (url) => {
    try {
        // Perform a HEAD request to get headers only
        const response = await axios.head(url);

        // Check for successful response
        if (response.status !== 200) {
            console.log(`Error: Status code is ${response.status}`);
            return false;
        }

        // Validate content type
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
            console.log('Error: Content type is not an image');
            return false;
        }

        return true; // The URL is a valid image
    } catch (err) {
        return false;
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

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}