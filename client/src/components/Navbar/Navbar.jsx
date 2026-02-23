import "./Navbar.css"
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import { ReactComponent as ExpandMoreIcon } from "../../assets/icons/expand_more.svg";
import { ReactComponent as LoginIcon } from "../../assets/icons/login.svg"
import PrimaryButton from "../PrimaryButton/PrimaryButton"


const pathToPageName = new Map([
    ["/", "Voting"],
    ["/rankings", "Rankings"],
    ["/leaderboard", "Leaderboard"]
])

const Navbar = (props) => {
    const [isNavExpanded, setIsNavExpanded] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const getAvailablePathsToPageNames = (curPath) => {
        // filter out the current page in pageNames
        const availablePages = Array.from(pathToPageName).filter(([path, _pageName]) => {
            return path !== curPath;
        })
        return availablePages;
    }

    return (
        <div className="Navbar">
            <div className="w-full grid grid-cols-2 grid-rows-[auto_auto] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:grid-rows-1 items-center mt-2 px-6">
                {/* title */}
                <div 
                    className="col-span-2 col-start-1 row-start-1 lg:col-span-1 lg:row-start-auto text-[4vh] md:text-[5vh] text-black dark:text-white"
                >
                    <NavLink to='/'>karimerank</NavLink>
                </div>
            
                {/* if on rankings page, render # of votes */}
                <div className="min-w-0 mr-4 col-start-1 row-start-2 lg:col-start-auto lg:row-start-auto"> {/* this wrapper keeps a permanent first grid cell, so the title stays centered on all pages*/}
                    {location.pathname === "/rankings" && 
                        <div 
                            className={`text-[2.5vh] md:text-[3.5vh] text-black dark:text-white whitespace-nowrap overflow-hidden text-ellipsis`}
                        >
                            {props.totalVotes} <span className="hidden md:inline">total</span> votes <span className="hidden lg:inline">worldwide</span>
                        </div>
                    }
                </div>
            

                {/* right side */}
                <div className="col-start-2 row-start-1 lg:col-start-auto lg:row-start-auto flex flex-row gap-2 md:gap-6 ml-4 text-[2.5vh] md:text-[3.5vh] justify-end">
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
                                <span>{pathToPageName.get(location.pathname)}</span>
                            </button>

                        {/* other navlinks when dropdown open */}
                        <div 
                            id="navbar-available-paths"
                            className={`available-paths absolute top-full flex flex-col items-end ${isNavExpanded ? "open" : "closed"} z-20 `}
                            aria-hidden={!isNavExpanded}    
                        >
                            <div className="absolute -inset-x-3 inset-y-0 rounded-lg bg-[#F8F8D6]/[0.97] dark:bg-[#4C4C4C]/[0.97] shadow-lg -z-10"/>
                            { 
                                getAvailablePathsToPageNames(location.pathname).map(([path, pageName]) => {
                                    return <div key={path} className="text-[#8c8c8c] hover:text-black dark:hover:text-white">
                                        <NavLink to={path} tabIndex={isNavExpanded ? 0 : -1} onClick={() => setIsNavExpanded(false)}>{pageName}</NavLink>
                                    </div>
                                })
                            }
                        </div>
                    </div>

                    {/* sign-in button / profile */}
                    <PrimaryButton 
                        className="px-5 max-[499px]:px-2 rounded-full leading-[2.5vh] md:leading-[3.5vh]"
                        onClick={() => navigate("login")}
                    >
                        <span className="max-[499px]:hidden">Sign in</span>
                        <LoginIcon className="hidden max-[499px]:block w-5 h-auto"/>
                    </PrimaryButton>
                </div>
            </div>
        </div>
    )
}

export default Navbar;
