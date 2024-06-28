import express from "express";
import { generateImagesByIdol, deleteIdol, getAllImages, getAllIdolNames, getRandomImagePair, getRandomImagePairByIdol, likeImage } from "../controllers/images.js"

const router = express.Router();
router.get("/", getAllImages);
router.get("/names", getAllIdolNames)
router.post("/generate", generateImagesByIdol)
router.get("/random", getRandomImagePair);
router.get("/random/:idolName", getRandomImagePairByIdol);
router.patch("/like", likeImage)
router.delete("/delete-idol", deleteIdol)

export default router;