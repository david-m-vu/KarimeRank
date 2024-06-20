import express from "express";
import { generateImagesByIdol, getAllImages, getRandomImagePair, getRandomImagePairByIdol, likeImage } from "../controllers/images.js"

const router = express.Router();
router.get("/", getAllImages);
router.post("/generate", generateImagesByIdol)
router.get("/random", getRandomImagePair);
router.get("/random/:idolName", getRandomImagePairByIdol);
router.patch("/like", likeImage)

export default router;