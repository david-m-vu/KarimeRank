import { withOptionalAuthHeader } from "./auth.js";

const USERS_BASE_URL = `${process.env.REACT_APP_BACKEND_BASE_URL}/users`

export const updateNickname = async (newNickname) => {
    try {
        const res = await fetch(`${USERS_BASE_URL}/me/nickname`, {
            method: "PATCH",
            credentials: "include",
            headers: withOptionalAuthHeader({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                nickname: newNickname
            })
        })

        let responseJson = null;
        try {
            responseJson = await res.json();
        } catch {
            responseJson = null;
        }

        if (!res.ok) {
            return { error: responseJson?.message || "Nickname update failed" };
        }

        return { updatedUser: responseJson?.updatedUser };

    } catch {
        return { error: "Network error. Please try again" };
    }
}
