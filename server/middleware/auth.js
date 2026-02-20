import jwt from "jsonwebtoken";

export const requireAuth = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT_SECRET is not configured" });
        }
        
        const accessToken = req.cookies?.access_token;
        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.auth = {
            userId: payload.id,
            usernameLower: payload.usernameLower
        }

        return next();
    } catch {
        return res.status(401).json({ message: "Unauthorized" })
    }
}