import { createContext, useCallback, useContext, useMemo, useReducer } from "react";

const AUTH_BASE_URL = `${process.env.REACT_APP_BACKEND_BASE_URL}/auth`;

const initialAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: ""
};

const authActionTypes = {
    LOGIN_START: "LOGIN_START",
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILURE: "LOGIN_FAILURE",
    CLEAR_ERROR: "CLEAR_ERROR",
    LOGOUT: "LOGOUT",
    UPDATE_USER: "UPDATE_USER"
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

    const updateUser = useCallback((newUser) => {
        dispatch({ 
            type: authActionTypes.UPDATE_USER, 
            payload: {
                user: newUser
            }
        })
    }, [])

    const value = useMemo(() => {
        return {
            ...state,
            login,
            clearAuthError,
            logoutLocal,
            updateUser
        }
    }, [state, login, clearAuthError, logoutLocal, updateUser])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}


