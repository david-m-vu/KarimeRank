import express from "express";
import { generateImagesByIdol, generateImageSet, getTotalVotes, updateAllIdols, deleteIdol, deleteImageById, getAllImages, getStartToEndImages, getAllIdolNames, getAllIdolNamesWithGroup, getRandomImagePair, getRandomImagePairByIdol, likeImage, addGroupNames, archiveImages, testAnything } from "../controllers/images.js"

const router = express.Router();
router.get("/", getAllImages);
router.get("/some", getStartToEndImages);
router.get("/votes", getTotalVotes);
router.get("/names", getAllIdolNames)
router.get("/groups", getAllIdolNamesWithGroup)

router.post("/generate", generateImagesByIdol)
router.post("/generate-set", generateImageSet)
router.post("/update-all", updateAllIdols);

router.get("/random", getRandomImagePair);
router.get("/random/:idolName", getRandomImagePairByIdol);

router.patch("/like", likeImage);
router.delete("/delete-idol", deleteIdol);
router.delete("/delete-image", deleteImageById);

router.patch("/add-group", addGroupNames);

router.get("/test", testAnything);
router.post("/archive", archiveImages);

export default router;