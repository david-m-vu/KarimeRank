import express from "express";
import { register, login, reauthenticateUser } from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, reauthenticateUser);

export default router;