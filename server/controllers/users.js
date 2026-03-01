import { updateNicknameByUserId, getTopUsersByVotes, resetAllUsersVoteStats, resetCurrentMonthGlobalVotes } from "../firebase/firestoreService.js";
import { isValidNickname, getDenylistMatch } from "../util/index.js";

const verifyKarimeRankKey = (req, res) => {
    const providedKey = req.headers.authorization?.replace("Bearer ", "");
    if (!providedKey || providedKey !== process.env.KARIMERANK_API_KEY) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    return true;
};

export const updateNickname = async (req, res) => {
    // get user id and new nickname
    try {
        const { userId } = req.auth;
        const { nickname } = req.body;

        const normalizedNickname = typeof nickname === "string" ? nickname.trim() : "";

        if (!isValidNickname(normalizedNickname)) {
            return res.status(400).json({ message: "nickname must be 2-30 characters with no leading/trailing and repeating separators/spaces" })
        }

        if (getDenylistMatch(normalizedNickname)) {
            return res.status(400).json({ message: "nickname contains disallowed words or reserved names" });
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

export const resetUsersMonthlyVotes = async (req, res) => {
    if (!verifyKarimeRankKey(req, res)) {
        return;
    }

    try {
        const useTestCollection = process.env.TEST_MODE === "TEST_MODE";
        const globalVotesRes = await resetCurrentMonthGlobalVotes(useTestCollection);
        if (!globalVotesRes) {
            return res.status(500).json({ message: "Failed to reset global monthly votes" });
        }

        const resetRes = await resetAllUsersVoteStats(useTestCollection);
        if (!resetRes) {
            return res.status(500).json({ message: "Failed to reset user vote stats" });
        }

        return res.status(200).json({
            message: "Reset global monthly votes and user monthly vote stats including idolVotes/imageVotes subcollections",
            globalVotes: globalVotesRes,
            users: resetRes
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: err.message });
    }
}
