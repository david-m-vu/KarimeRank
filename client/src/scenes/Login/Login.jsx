import "./Login.css"

import { useRef, useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"

import KarinaGreet from "../../assets/karina-greet.png";
import PrimaryButton from "../../components/PrimaryButton/PrimaryButton.jsx"

const Login = () => {
    const usernameRef = useRef();
    const errRef = useRef();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [errMsg, setErrMsg] = useState("");
    const [submittedOnce, setSubmittedOnce] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login, error: authError, isLoading, clearAuthError } = useAuth();

    useEffect(() => {
        usernameRef.current.focus();
    }, [])
    
    // if user updates username or password, we can set errMsg to ""
    useEffect(() => {
        setErrMsg("");
        clearAuthError();
    }, [username, password, clearAuthError])

    useEffect(() => {
        if (authError) {
            setErrMsg(authError);
        }
    }, [authError])

    useEffect(() => {
        const infoMessage = location.state?.infoMessage;
        if (!infoMessage) {
            return;
        }

        setErrMsg(infoMessage);

        // rewrite the current history entry for the same route, but clear route state so infoMessage disappears on refresh
        navigate(location.pathname, { replace: true, state: null })
    }, [location.pathname, location.state, navigate])
    
    const handleSubmit = async (e) => {
        e.preventDefault()

        setSubmittedOnce(true);

        if (!username || !password) {
            setErrMsg("Invalid Entry")
            return;
        }

        try {
            const result = await login({ username, password });
            if (!result.ok) {
                setErrMsg(result.error);
                return;
            }

            navigate("/")

        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed. Please try again"
            setErrMsg(message);

            if (errRef.current) {
                errRef.current.focus()
            }
        }
    }
    
    return (
        <div id="login" className="flex-1 flex items-center justify-center">
            <form onSubmit={handleSubmit} className="z-10 flex flex-col items-center w-full max-w-sm px-8 py-12 gap-3 bg-[#FFFFF0] dark:bg-[#2c2c2c] shadow-xl rounded-2xl">
                <div className="flex flex-col gap-3 w-full">
                    <div className="text-center text-[2.5rem]">
                        Login
                    </div>

                    <div className="input-text flex flex-col gap-3 items-start text-[1.25rem] w-full">
                        <div className="flex flex-col w-full">
                            <label className="" htmlFor="username">Username:</label>
                            <input type="text" id="username" name="username"
                                ref={usernameRef}
                                autoComplete="username"
                                className="rounded-xl py-1 px-2 border-black dark:border-white border min-w-[10rem] w-full"
                                value={username}
                                required
                                aria-invalid={submittedOnce && (username === "")}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                }}
                            />
                        </div>
                        
                        <div className="flex flex-col w-full">
                            <label htmlFor="password">Password:</label>
                            <input type="password" id="password" name="password" 
                                autoComplete="current-password"
                                className="rounded-xl py-1 px-2 border-black dark:border-white border min-w-[10rem] w-full"
                                value={password}
                                required
                                aria-invalid={submittedOnce && (password === "")}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                }}
                            />
                        </div>
                    </div>

                    {/* error message */}
                    <p 
                        className="min-h-12 text-[#FF6961] text-center w-full break-words" 
                        ref={errRef}
                        role="alert"
                        aria-live="assertive"
                        tabIndex={-1}
                    >
                        {errMsg}
                    </p>
                </div>


                {/* buttons */}
                <div className="flex flex-row w-full justify-between text-[1.25rem]">
                    <Link to="/register" className="hover:opacity-90 active:opacity-80 hover:bg-[#E8E8DC] dark:hover:bg-[#3A3A38] px-4 py-1 rounded-full">
                        Sign Up
                    </Link>
                    <PrimaryButton type="submit" className="px-8 rounded-2xl" disabled={username === "" || password === ""}>
                        {isLoading ? "Logging in..." : "Login"}
                    </PrimaryButton>
                </div>
            </form>
            
            <img src={KarinaGreet} alt="Karina Greet" className="fixed bottom-0 left-0 h-[50vw] lg:h-auto lg:w-auto"/>
        </div>
    )
}

export default Login
