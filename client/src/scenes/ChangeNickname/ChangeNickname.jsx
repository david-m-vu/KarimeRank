import "./ChangeNickname.css"

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom"

import { updateNickname } from "../../requests/users.js"; 
import { useAuth } from "../../context/AuthContext.jsx";

import PrimaryButton from "../../components/PrimaryButton/PrimaryButton.jsx";
import KarinaGreet from "../../assets/karina-greet.png";

const NICKNAME_REGEX = /^(?=.{2,30}$)[A-Za-z0-9]+(?:[ ._-][A-Za-z0-9]+)*$/;
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 30;

const ChangeNickname = () => {
    const [nickname, setNickname] = useState("");
    const [nicknameTouched, setNicknameTouched] = useState(false);
    const [submittedOnce, setSubmittedOnce] = useState(false);
    
    const [errMsg, setErrMsg] = useState("");
    
    const nicknameRef = useRef();
    const errRef = useRef();

    const navigate = useNavigate();
    const { updateUser } = useAuth();

    useEffect(() => {
        nicknameRef.current.focus()
    }, [])
    
    useEffect(() => {
        setErrMsg("");
    }, [nickname])

    const getNicknameError = (input) => {
        if (!input) {
            return "Enter a nickname or click Skip";
        }
        if (input.length < NICKNAME_MIN || input.length > NICKNAME_MAX) {
            return "Nickname must be 2-30 characters long"
        }
        if (!NICKNAME_REGEX.test(input)) {
            return "Nickname must have no leading/trailing and repeating separators/spaces" 
        }
        return "";
    }

    const trimmedNickname = nickname.trim();
    const nicknameError = getNicknameError(trimmedNickname);
    const displayedError = errMsg || ((nicknameTouched || submittedOnce) && nicknameError);

    const handleSubmit = async (e) =>{
        e.preventDefault();

        setSubmittedOnce(true);
        if (nicknameError) {
            return;
        }

        try {
            const res = await updateNickname(trimmedNickname);
            if (res.error) {
                setErrMsg(res.error);
                return;
            }

            if (!res.updatedUser) {
                setErrMsg("Nickname update succeeded but user data was missing");
                return;
            }

            updateUser(res.updatedUser);
            navigate("/");
        } catch (err) {
            const message = (err instanceof Error) ? err.message : "Nickname update failed. Please try again"
            setErrMsg(message);
            errRef.current.focus();
        }
    } 
    
    return (
        <div id="change-nickname" className="flex-1 flex items-center justify-center">
            <form onSubmit={handleSubmit} className="z-10 flex flex-col items-center w-full max-w-sm px-8 py-12 gap-3 bg-[#FFFFF0] dark:bg-[#2c2c2c] shadow-xl rounded-2xl">
                <div className="flex flex-col gap-3 w-full">
                    <div className="text-center text-[2.5rem]">
                        Set a nickname?
                    </div>

                    <div className="input-text text-[1.25rem] flex flex-col w-full">
                        <label className="" htmlFor="nickname">Nickname:</label>
                        <input type="text" id="nickname" name="nickname"
                            ref={nicknameRef}
                            autoComplete="off"
                            className="rounded-xl py-1 px-2 border-black dark:border-white border min-w-[10rem] w-full"
                            value={nickname}
                            aria-invalid={(submittedOnce || nicknameTouched) && nicknameError}
                            onChange={(e) => {
                                setNickname(e.target.value);
                            }}
                            onBlur={() => setNicknameTouched(true)}
                        />
                    </div>

                    {/* error message */}
                    <p 
                        className="min-h-12 text-[#FF6961] text-center w-full break-words" 
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
                    <Link to="/" className=" hover:opacity-90 active:opacity-80">
                        Skip
                    </Link>
                    <PrimaryButton type="submit" className="px-8 rounded-2xl" disabled={Boolean(nicknameError)} >
                        Save
                    </PrimaryButton>
                </div>
            </form>
            
            <img src={KarinaGreet} alt="Karina Greet" className="fixed bottom-0 left-0"/>
        </div>
    )
}

export default ChangeNickname
