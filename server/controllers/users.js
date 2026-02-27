import { updateNicknameByUserId, getTopUsersByVotes  } from "../firebase/firestoreService.js";
import { isValidNickname } from "../util/index.js";

export const updateNickname = async (req, res) => {
    // get user id and new nickname
    try {
        const { userId } = req.auth;
        const { nickname } = req.body;

        const normalizedNickname = typeof nickname === "string" ? nickname.trim() : "";

        if (!isValidNickname(normalizedNickname)) {
            return res.status(400).json({ message: "nickname must be 2-30 characters with no leading/trailing and repeating separators/spaces" })
        }

        const collectionName = process.env.TEST_MODE === "TEST_MODE" ? "test_users" : "users"

        const updatedUser = await updateNicknameByUserId(collectionName, userId, normalizedNickname);
        if (!updatedUser) {
            return res.status(404).json({ message: `User with userId ${userId} was not found` });
        }

        delete updatedUser.passwordHash;
        return res.status(200).json({ updatedUser });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: err.message })
    }
    
}
export const getLeaderboard = async (req, res) => {
    try {
        const collectionName = process.env.TEST_MODE === "TEST_MODE" ? "test_users" : "users";

        const topUsers = await getTopUsersByVotes(collectionName, 10);
        if (!topUsers) {
            return res.status(500).json({ message: "Failed to fetch leaderboard" });
        }

        return res.status(200).json({ leaderboard: topUsers });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: err.message });
    }
}