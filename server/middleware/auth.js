import jwt from "jsonwebtoken";

// tries get access token from cookie first. If it doesn't exist, get it from the headers
const getAccessTokenFromRequest = (req) => {
    const cookieToken = req.cookies?.access_token;
    if (cookieToken) {
        return cookieToken;
    }

    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        return authHeader.replace("Bearer ", "").trim();
    }

    return "";
};

export const requireAuth = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT_SECRET is not configured" });
        }
        
        const accessToken = getAccessTokenFromRequest(req);
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

// if the user is authorized with a jwt, set req.auth
export const authOptional = async (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const accessToken = getAccessTokenFromRequest(req);
    if (!accessToken) {
        return next();
    }

    try {
        const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.auth = {
            userId: payload.id,
            usernameLower: payload.usernameLower
        };
    } catch {
        // Optional auth should not block requests when token is invalid/expired.
    }

    return next();
}
