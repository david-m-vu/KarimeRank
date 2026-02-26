import { createContext, useCallback, useContext, useMemo, useEffect, useReducer } from "react";

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

            dispatch({
                type: authActionTypes.LOGIN_SUCCESS,
                payload: { user: responseJson.user }
            })
            return { ok: true, user: responseJson.user };

        } catch {
            const errorMessage = "Network error. Please try again";
            dispatch({
                type: authActionTypes.LOGIN_FAILURE,
                payload: { error: errorMessage }
            });
            return { ok: false, error: errorMessage }
        }
    }, [])

    const clearAuthError = useCallback(() => {
        dispatch({ type: authActionTypes.CLEAR_ERROR });
    }, []);

    const logoutLocal = useCallback(() => {
        dispatch({ type: authActionTypes.LOGOUT });
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch(`${AUTH_BASE_URL}/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // If network logout fails, still clear local auth state.
        } finally {
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
            const res = await fetch(`${AUTH_BASE_URL}/me`, {
                method: "GET",
                credentials: "include",
            })

            const responseJson = await res.json();
            if (!res.ok) {
                dispatch({ 
                    type: authActionTypes.BOOTSTRAP_FAILURE, 
                })
                return;
            }

            // success
            dispatch({
                type: authActionTypes.BOOTSTRAP_SUCCESS,
                payload: {
                    user: responseJson.user
                }
            })

        } catch {
            dispatch({
                type: authActionTypes.BOOTSTRAP_FAILURE,
            })
        }
    }, [])

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
