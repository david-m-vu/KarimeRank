import { createContext, useCallback, useContext, useMemo, useEffect, useReducer } from "react";
import { clearStoredAccessToken, getStoredAccessToken, setStoredAccessToken } from "../requests/auth.js";

const AUTH_BASE_URL = `${process.env.REACT_APP_BACKEND_BASE_URL}/auth`;

const initialAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: "",
    isBootstrapping: false
};

const authActionTypes = {
    LOGIN_START: "LOGIN_START",
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILURE: "LOGIN_FAILURE",
    CLEAR_ERROR: "CLEAR_ERROR",
    LOGOUT: "LOGOUT",
    UPDATE_USER: "UPDATE_USER",

    BOOTSTRAP_START: "BOOTSTRAP_START",
    BOOTSTRAP_SUCCESS: "BOOTSTRAP_SUCCESS",
    BOOTSTRAP_FAILURE: "BOOTSTRAP_FAILURE",

    APPLY_VOTE_STATS: "APPLY_VOTE_STATS"
}

const authReducer = (state, action) => {
    switch (action.type) {
        case authActionTypes.LOGIN_START: {
            return {
                ...state,
                isLoading: true,
                error: ""
            }   
        }
        case authActionTypes.LOGIN_SUCCESS: {
            return {
                ...state,
                user: action.payload.user,
                isAuthenticated: true,
                isLoading: false,
                error: "",
            }
        }
        case authActionTypes.LOGIN_FAILURE: {
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload.error
            }
        }
        case authActionTypes.CLEAR_ERROR: {
            return {
                ...state,
                error: ""
            }
        }
        case authActionTypes.LOGOUT: {
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: ""
            }
        }
        case authActionTypes.UPDATE_USER: {
            return {
                ...state,
                user: action.payload.user,
            }
        }
        case authActionTypes.BOOTSTRAP_START: {
            return {
                ...state,
                isBootstrapping: true,
                error: "",
            }
        }
        case authActionTypes.BOOTSTRAP_SUCCESS: {
            return {
                ...state,
                user: action.payload.user,
                isAuthenticated: true,
                isBootstrapping: false,
                error: ""
            }
        }
        case authActionTypes.BOOTSTRAP_FAILURE: {
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isBootstrapping: false,
                error: ""
            }
        }
        case authActionTypes.APPLY_VOTE_STATS: {
            if (!state.user || !action.payload?.userVoteStats) {
                return state;
            }

            return {
                ...state,
                user: {
                    ...state.user,
                    ...action.payload.userVoteStats
                }
            }
        }
        default: {
            return state;
        }
    }
}

const AuthContext = createContext(undefined);

// wrapper of AuthContext.Provider that adds actions that updates the state
// with useReducer in addition to state
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialAuthState);

    // tries to reauthenticate the user using either the access_token in the cookie or the passed-in access token
    const fetchMe = useCallback(async (token = "") => {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${AUTH_BASE_URL}/me`, {
            method: "GET",
            credentials: "include",
            headers,
        });

        let responseJson = null;
        try {
            responseJson = await res.json();
        } catch {
            responseJson = null;
        }

        return { res, responseJson };
    }, []);

    const login = useCallback(async ({ username, password }) => {
        dispatch({ type: authActionTypes.LOGIN_START });

        try {
            const res = await fetch(`${AUTH_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    username,
                    password
                })
            })

            const responseJson = await res.json();
            if (!res.ok) {
                const errorMessage = responseJson?.message || "Login failed";
                dispatch({ // this is an action
                    type: authActionTypes.LOGIN_FAILURE,
                    payload: { error: errorMessage }
                })
                return { ok: false, error: errorMessage };
            }

            const token = responseJson?.token || "";

            // Cookie-first: if server-set cookie works, avoid persisting fallback token.
            const cookieSession = await fetchMe(); // pass in no token to check if the access_token is stored in the cookie
            if (cookieSession.res.ok) { // access_token in cookie
                clearStoredAccessToken(); // don't need local storage access_token anymore
                dispatch({
                    type: authActionTypes.LOGIN_SUCCESS,
                    payload: { user: cookieSession.responseJson?.user || responseJson.user }
                });
                return { ok: true, user: cookieSession.responseJson?.user || responseJson.user };
            }

            // no token if login didn't respond with a token in the response body for some reason
            if (!token) {
                const errorMessage = "Login succeeded but no usable auth session was created";
                dispatch({
                    type: authActionTypes.LOGIN_FAILURE,
                    payload: { error: errorMessage }
                });
                return { ok: false, error: errorMessage };
            }

            // if we're here, that means cookie access_token didn't work, so we have to store in local storage
            setStoredAccessToken(token);
            const bearerSession = await fetchMe(token);

            if (!bearerSession.res.ok) {
                clearStoredAccessToken();
                const errorMessage = "Login succeeded but authentication failed";
                dispatch({
                    type: authActionTypes.LOGIN_FAILURE,
                    payload: { error: errorMessage }
                });
                return { ok: false, error: errorMessage };
            }

            // login_success bearer token path
            dispatch({
                type: authActionTypes.LOGIN_SUCCESS,
                payload: { user: bearerSession.responseJson?.user || responseJson.user }
            });
            return { ok: true, user: bearerSession.responseJson?.user || responseJson.user };

        } catch {
            const errorMessage = "Network error. Please try again";
            dispatch({
                type: authActionTypes.LOGIN_FAILURE,
                payload: { error: errorMessage }
            });
            return { ok: false, error: errorMessage }
        }
    }, [fetchMe])

    const clearAuthError = useCallback(() => {
        dispatch({ type: authActionTypes.CLEAR_ERROR });
    }, []);

    const logoutLocal = useCallback(() => {
        clearStoredAccessToken();
        dispatch({ type: authActionTypes.LOGOUT });
    }, []);

    const logout = useCallback(async () => {
        try {
            // note that when logging out we need to send the cookie so they can clear it
            await fetch(`${AUTH_BASE_URL}/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // If network logout fails, still clear local auth state.
        } finally {
            clearStoredAccessToken();
            dispatch({ type: authActionTypes.LOGOUT });
        }
    }, []);

    const updateUser = useCallback((newUser) => {
        dispatch({ 
            type: authActionTypes.UPDATE_USER, 
            payload: {
                user: newUser
            }
        })
    }, [])

    const bootstrapAuth = useCallback(async () => {
        dispatch({ type: authActionTypes.BOOTSTRAP_START });

        try {
            // try cookie rehydration first
            const cookieSession = await fetchMe();
            if (cookieSession.res.ok) {
                clearStoredAccessToken();
                dispatch({
                    type: authActionTypes.BOOTSTRAP_SUCCESS,
                    payload: {
                        user: cookieSession.responseJson?.user
                    }
                });
                return;
            }

            // then try bearer access_token rehydration
            const storedToken = getStoredAccessToken();
            if (!storedToken) {
                dispatch({ 
                    type: authActionTypes.BOOTSTRAP_FAILURE, 
                });
                return;
            }

            const bearerSession = await fetchMe(storedToken);
            if (!bearerSession.res.ok) {
                clearStoredAccessToken();
                dispatch({ 
                    type: authActionTypes.BOOTSTRAP_FAILURE, 
                });
                return;
            }

            dispatch({
                type: authActionTypes.BOOTSTRAP_SUCCESS,
                payload: {
                    user: bearerSession.responseJson?.user
                }
            });

        } catch {
            dispatch({
                type: authActionTypes.BOOTSTRAP_FAILURE,
            })
        }
    }, [fetchMe])

    useEffect(() => {
        bootstrapAuth();
    }, [bootstrapAuth])

    const applyUserVoteStats = useCallback((userVoteStats) => {
        dispatch({
            type: authActionTypes.APPLY_VOTE_STATS,
            payload: { userVoteStats }
        })
    }, [])

    const value = useMemo(() => {
        return {
            ...state,
            login,
            clearAuthError,
            logout,
            logoutLocal,
            updateUser,
            bootstrapAuth,
            applyUserVoteStats
        }
    }, [state, login, clearAuthError, logout, logoutLocal, updateUser, bootstrapAuth, applyUserVoteStats])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
