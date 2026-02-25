import "./Navbar.css"
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import { ReactComponent as ExpandMoreIcon } from "../../assets/icons/expand_more.svg";
import { ReactComponent as LoginIcon } from "../../assets/icons/login.svg";
import { ReactComponent as PersonIcon } from "../../assets/icons/person_outline.svg";
import PrimaryButton from "../PrimaryButton/PrimaryButton";

import { useAuth } from "../../context/AuthContext.jsx";

const NAV_ITEMS = [
    { path: "/", label: "Voting"},
    { path: "/rankings", label: "Rankings"},
    { path: "/leaderboard", label: "Leaderboard"}
]

const Navbar = (props) => {
    const [isNavExpanded, setIsNavExpanded] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const getAvailablePathsToPageNames = (curPath) => {
        // filter out the current page in pageNames
        const availablePages = NAV_ITEMS.filter(({path, _pageName}) => {
            return path !== curPath;
        })
        return availablePages;
    }

    const { user, isAuthenticated, isBootstrapping } = useAuth();

    return (
        <div className="Navbar">
            <div className="w-full grid grid-cols-2 grid-rows-[auto_auto] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:grid-rows-1 items-center my-4 lg:my-5 px-6">
                {/* title */}
                <div 
                    className="col-span-2 col-start-1 row-start-1 sm:col-span-1 sm:row-start-auto text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-black dark:text-white"
                >
                    <NavLink to='/'>karimerank</NavLink> 
                </div>
            
                {/* if on rankings page, render # of votes */}
                <div className="min-w-0 mr-4 col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto"> {/* this wrapper keeps a permanent first grid cell, so the title stays centered on all pages*/}
                    {location.pathname === "/rankings" && 
                        <div 
                            className={`text-xl md:text-2xl lg:text-3xl xl:text-4xl text-black dark:text-white whitespace-nowrap overflow-hidden text-ellipsis`}
                        >
                            {props.totalVotes} <span className="hidden sm:inline">total</span> votes <span className="hidden lg:inline">worldwide</span>
                        </div>
                    }
                </div>
            

                {/* right side */}
                {!["/login", "/register"].includes(location.pathname) && 
                    <div className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto flex flex-row gap-2 md:gap-6 ml-4 text-xl md:text-2xl lg:text-3xl xl:text-4xl justify-end items-center">                        
                        {/* nav dropdown */}
                        <div className="relative flex flex-col items-end">
                            {/* current page navlink */}
                                <button
                                    type="button"
                                    className="group inline-flex flex-row justify-center items-center cursor-pointer text-black dark:text-white transition-opacity duration-150 hover:opacity-90 active:opacity-80"
                                    onClick={() => setIsNavExpanded((prev) => !prev)}
                                    aria-label={isNavExpanded ? "Collapse navigation" : "Expand navigation"}
                                    aria-expanded={isNavExpanded}
                                    aria-controls="navbar-available-paths"
                                >
                                    <ExpandMoreIcon
                                        className={`w-6 md:w-10 h-auto transition-transform duration-200 ${isNavExpanded ? "rotate-0" : "rotate-180"}`}
                                    />
                                    <span>{NAV_ITEMS.find((item) => item.path === location.pathname)?.label}</span>
                                </button>

                            {/* other navlinks when dropdown open */}
                            <div 
                                id="navbar-available-paths"
                                className={`available-paths absolute top-[calc(100%+4px)] lg:gap-1 flex flex-col items-end ${isNavExpanded ? "open" : "closed"} z-20`}
                                aria-hidden={!isNavExpanded}    
                            >
                                <div className="absolute -inset-x-3 inset-y-0 lg:-inset-y-1 rounded-lg bg-[#F8F8D6]/[0.97] dark:bg-[#4C4C4C]/[0.97] shadow-lg -z-10"/>
                                { 
                                    getAvailablePathsToPageNames(location.pathname).map(({path, label}) => {
                                        return <div key={path} className="text-[#8c8c8c] hover:text-black dark:hover:text-white">
                                            <NavLink to={path} tabIndex={isNavExpanded ? 0 : -1} onClick={() => setIsNavExpanded(false)}>{label}</NavLink>
                                        </div>
                                    })
                                }
                            </div>
                        </div>

                        {/* auth state */}
                        {isBootstrapping ? (
                            <div className="auth-bootstrap-indicator text-[0.75rem] md:text-[0.875rem] text-[#6c6c6c] dark:text-[#b8b8b8] whitespace-nowrap">
                                Checking session...
                            </div>
                        ) : isAuthenticated ? (
                            <button className="rounded-full border border-black dark:border-white w-8 h-8 md:w-12 md:h-12 shrink-0 p-0 flex justify-center items-center" >
                                <PersonIcon className="text-black dark:text-white w-6 h-6 md:w-8 md:h-8"></PersonIcon>
                            </button>
                        ) : (
                            <PrimaryButton 
                                className="px-5 max-[499px]:px-2 max-[499px]:py-2 rounded-full text-xl md:text-2xl lg:text-3xl xl:text-4xl"
                                onClick={() => navigate("login")}
                            >
                                <span className="max-[499px]:hidden">Sign in</span>
                                <LoginIcon className="hidden max-[499px]:block w-5 h-auto"/>
                            </PrimaryButton>
                        )}
                    </div>
                }
            </div>
        </div>
    )
}

export default Navbar;
