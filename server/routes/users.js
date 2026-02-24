import express from "express";

import { updateNickname } from "../controllers/users.js";
import { requireAuth } from "../middleware/auth.js";

const router = new express.Router();

router.patch("/me/nickname", requireAuth, updateNickname);

export default router;