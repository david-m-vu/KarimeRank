import express from "express";

import { updateNickname, getLeaderboard} from "../controllers/users.js";
import { requireAuth } from "../middleware/auth.js";

const router = new express.Router();

router.patch("/me/nickname", requireAuth, updateNickname);

router.get("/leaderboard", getLeaderboard);  // no requireAuth — leaderboard is public

export default router;