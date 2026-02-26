import "./Register.css";

import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";

import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import KarinaGreet from "../../assets/karina-greet.png";

const AUTH_BASE_URL = `${process.env.REACT_APP_BACKEND_BASE_URL}/auth`;

const USERNAME_REGEX = /^(?=.{3,20}$)[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72;

const Register = () => {
    const [username, setUsername] = useState("");
    const [usernameTouched, setUsernameTouched] = useState(false);

    const [password, setPassword] = useState("");
    const [passwordTouched, setPasswordTouched] = useState(false);

    const [passwordMatch, setPasswordMatch] = useState("");
    const [passwordMatchTouched, setPasswordMatchTouched] = useState(false);

    const [submittedOnce, setSubmittedOnce] = useState(false);
    const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);

    const [registerErrMsg, setRegisterErrMsg] = useState("");

    const usernameRef = useRef();
    const errRef = useRef();

    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        usernameRef.current.focus();
    }, [])
    
    useEffect(() => {
        setRegisterErrMsg("")
    }, [username, password, passwordMatch])

    const getUsernameError = (input) => {
        if (!input) {
            return "Username is required";
        }
        if (input.length < USERNAME_MIN || input.length > USERNAME_MAX) {
            return `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters long (inclusive)`
        }
        if (!USERNAME_REGEX.test(input)) {
            return "Username must only contain letters, numbers, periods, underscores, and dashes with no leading/trailing and repeating separators"
        }
        return "";
    }

    const getPasswordError = (input) => {
        if (!input) {
            return "Password is required";
        }
        if (input.length < PASSWORD_MIN || input.length > PASSWORD_MAX) {
            return `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters long (inclusive)`;
        }
        return "";
    }

    const getPasswordMatchError = (input) => {
        if (input !== password) {
            return "Passwords must match"
        }
        return "";
    }

    const usernameError = getUsernameError(username);
    const passwordError = getPasswordError(password);
    const passwordMatchError = getPasswordMatchError(passwordMatch);
    const displayedError = registerErrMsg || (usernameTouched && usernameError) || (passwordTouched && passwordError) || (passwordMatchTouched && passwordMatchError);
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmittedOnce(true);
        setRegisterErrMsg("");

        setUsernameTouched(true);
        setPasswordTouched(true);
        setPasswordMatchTouched(true);
        if (usernameError || passwordError || passwordMatchError) {
            return;
        }

        try {
            setIsSubmittingRegister(true);
            const res = await fetch(`${AUTH_BASE_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password
                })
            })

            const resJson = await res.json();
            if (!res.ok) {
                setRegisterErrMsg(resJson.message);
                return;
            }

            // immediately login if success
            try {
                const result = await login({ username, password });
                if (!result.ok) {
                    // register succeeds but login failed
                    navigate("/login", {
                        state: {
                            infoMessage: "Your account was created. Please log in to continue.",
                        },
                    });
                    return;
                }

                navigate("/onboarding/nickname");

            } catch {
                // register succeeds but login failed
                navigate("/login", {
                    state: {
                        infoMessage: "Your account was created. Please log in to continue.",
                    },
                });
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : "Register failed. Please try again";
            setRegisterErrMsg(message);

            if (errRef.current) {
                errRef.current.focus();
            }
        } finally {
            setIsSubmittingRegister(false);
        }
    }
    
    return (
        <div id="register" className="flex-1 flex items-center justify-center">
            <form onSubmit={handleSubmit} className="z-10 flex flex-col items-center w-full max-w-sm px-8 py-12 gap-3 bg-[#FFFFF0] dark:bg-[#2c2c2c] shadow-xl rounded-2xl">
                <div className="flex flex-col gap-3 w-full">
                    <div className="text-center text-[2.5rem]">
                        Sign up
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
                                aria-invalid={Boolean((usernameTouched || submittedOnce) && usernameError)}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                }}
                                onBlur={() => setUsernameTouched(true)}
                            />
                        </div>
                        
                        <div className="flex flex-col w-full">
                            <label htmlFor="password">Password:</label>
                            <input type="password" id="password" name="password" 
                                autoComplete="new-password"
                                className="rounded-xl py-1 px-2 border-black dark:border-white border min-w-[10rem] w-full"
                                value={password}
                                required
                                aria-invalid={Boolean((passwordTouched || submittedOnce) && passwordError)}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                }}
                                onBlur={() => setPasswordTouched(true)}
                            />
                        </div>

                        <div className="flex flex-col w-full">
                            <label htmlFor="confirmPassword">Confirm Password:</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" 
                                autoComplete="new-password"
                                className="rounded-xl py-1 px-2 border-black dark:border-white border min-w-[10rem] w-full"
                                value={passwordMatch}
                                required
                                aria-invalid={Boolean((passwordMatchTouched || submittedOnce) && passwordMatchError)}
                                onChange={(e) => {
                                    setPasswordMatch(e.target.value);
                                }}
                                onBlur={() => setPasswordMatchTouched(true)}
                            />
                        </div>
                    </div>

                    {/* error message */}
                    <p 
                        className="min-h-[4.5rem] text-[#FF6961] text-center w-full break-words" 
                        ref={errRef}
                        role="alert"
                        aria-live="assertive"
                        tabIndex={-1}
                    >
                        {displayedError}
                    </p>
                </div>


                {/* buttons */}
                <div className="flex flex-row w-full justify-between text-[1.25rem]">
                    <Link to="/login" className=" hover:opacity-90 active:opacity-80 hover:bg-[#E8E8DC] dark:hover:bg-[#3A3A38] px-4 py-1 rounded-full">
                        Login
                    </Link>
                    <PrimaryButton
                        type="submit"
                        className="px-8 rounded-2xl"
                        disabled={Boolean(usernameError || passwordError || passwordMatchError || isSubmittingRegister || isLoading)}
                    >
                        {isSubmittingRegister ? "Creating account..." : (isLoading ? "Attemping Login..." : "Sign up")}
                    </PrimaryButton>
                </div>
            </form>
            
            <img src={KarinaGreet} alt="Karina Greet" className="fixed bottom-0 left-0"/>
        </div>
    )
}

export default Register
