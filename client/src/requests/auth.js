const ACCESS_TOKEN_STORAGE_KEY = "karimerank_access_token";

export const getStoredAccessToken = () => {
    try {
        return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || "";
    } catch {
        return "";
    }
};

export const setStoredAccessToken = (token) => {
    try {
        if (!token) {
            localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
            return;
        }

        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } catch {
        // Ignore storage errors (private mode/quota/etc).
    }
};

export const clearStoredAccessToken = () => {
    try {
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch {
        // Ignore storage errors.
    }
};

export const withOptionalAuthHeader = (headers = {}) => {
    const token = getStoredAccessToken();
    if (!token) {
        return headers;
    }

    return {
        ...headers,
        Authorization: `Bearer ${token}`,
    };
};
