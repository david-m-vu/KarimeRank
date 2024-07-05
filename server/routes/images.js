import express from "express";
import { generateImagesByIdol, updateAllIdols, deleteIdol, getAllImages, getAllIdolNames, getAllIdolNamesWithGroup, getRandomImagePair, getRandomImagePairByIdol, likeImage, addGroupNames } from "../controllers/images.js"

const router = express.Router();
router.get("/", getAllImages);
router.get("/names", getAllIdolNames)
router.get("/groups", getAllIdolNamesWithGroup)
router.post("/generate", generateImagesByIdol)
router.post("/update-all", updateAllIdols);
router.get("/random", getRandomImagePair);
router.get("/random/:idolName", getRandomImagePairByIdol);
router.patch("/like", likeImage)
router.delete("/delete-idol", deleteIdol)

router.patch("/add-group", addGroupNames)

export default router;