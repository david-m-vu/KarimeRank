import { getUserByUsernameLower, getUserByUserId, saveUser } from "../firebase/firestoreService.js";
import { isValidUsername, isValidNickname } from "../util/index.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const { username, password, nickname } = req.body;
        const normalizedUsername = typeof username === "string" ? username.trim() : "";
        const normalizedNickname = typeof nickname === "string" ? nickname.trim() : "";

        if (!normalizedUsername || !password) {
            return res.status(400).json({ message: "username and password are required" });
        }

        // if normalizedUsername doesn't satisfy regex
        if (!isValidUsername(normalizedUsername)) {
            return res.status(400).json({
                message: "username must be 3-20 characters and only contain letters, numbers, and underscores with no leading/trailing and repeating separators",
            });
        }

        if (typeof password !== "string" || password.length < 6 || password.length > 72) {
            return res.status(400).json({ message: "password must be between 6 and 72 characters" });
        }

        if (normalizedNickname && !isValidNickname(normalizedNickname)) {
            return res.status(400).json({ message: "nickname must be 2-30 characters with no leading/trailing and repeating separators/spaces" });
        }

        // if user didn't input nickname, set it to normalizedUsername
        const finalNickname = normalizedNickname || normalizedUsername;

        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_users" : "users";
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = {
            username: normalizedUsername,
            usernameLower: normalizedUsername.toLowerCase(),
            passwordHash,
            nickname: finalNickname,
            totalVotes: 0,
            favoriteIdol: "",
            favoriteIdolVotes: 0,
            favoriteImage: {
                id: "",
                url: "",
                width: 0,
                height: 0,
                votes: 0,
            },
            lastLoginAt: null,
        }

        const savedUser = await saveUser(collectionName, newUser);

        if (!savedUser) {
            return res.status(409).json({ message: "username already exists" });
        }

        // don't send password hash back to the user
        delete savedUser.passwordHash;

        return res.status(201).json(savedUser)

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message })
    }
    
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (typeof username !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "username and password must be strings" });
        }

        const normalizedUsername = username.trim();
        if (!normalizedUsername || !password) {
            return res.status(400).json({ message: "username and password are required" });
        }

        const usernameLower = normalizedUsername.toLowerCase();
        const collectionName = (process.env.TEST_MODE === "TEST_MODE") ? "test_users" : "users";
        const user = await getUserByUsernameLower(collectionName, usernameLower);

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" }); 
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            // same message as !user to avoid username enumerations and credential stuffing - make generic message
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT_SECRET is not configured" });
        }

        const token = jwt.sign(
            { id: user.id, usernameLower: user.usernameLower },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true on HTTPS prod
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // versus "expires", which is an absolute timestamp
        })

        delete user.passwordHash;
        return res.status(200).json({ user });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message })
    }
}

export const reauthenticateUser = async (req, res) => {
    const { userId } = req.auth;

    const collectionName = process.env.TEST_MODE === "TEST_MODE" ? "test_users" : "users";

    const user = await getUserByUserId(collectionName, userId);

    if (!user) {
        return res.status(404).json({ message: "User not found given user Id" })
    }

    delete user.passwordHash;
    return res.status(200).json({ user })
}

export const logout = async (req, res) => {
    try {
        // clearCookie is from express
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return res.status(200).json({ message: "Logged out" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}
