import "./Navbar.css"
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom"

import { ReactComponent as ExpandMore } from "../../assets/icons/expand_more.svg";

const pathToPageName = new Map([
    ["/", "Voting"],
    ["/rankings", "Rankings"],
    ["/leaderboard", "Leaderboard"]
])

const Navbar = (props) => {
    const [isNavExpanded, setIsNavExpanded] = useState(false);

    const location = useLocation();

    const getAvailablePathsToPageNames = (curPath) => {
        // filter out the current page in pageNames
        const availablePages = Array.from(pathToPageName).filter(([path, _pageName]) => {
            return path !== curPath;
        })
        return availablePages;
    }

    return (
        <div className="Navbar">
            <div className="w-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center my-2">
                {/* if on rankings page, render # of votes */}
                <div className="min-w-0 ml-6 mr-4"> {/* this wrapper keeps a permanent first grid cell, so the title stays centered on all pages*/}
                    {location.pathname === "/rankings" && 
                        <div 
                            className={`text-[2.5vh] md:text-[3.5vh] text-black dark:text-white whitespace-nowrap overflow-hidden text-ellipsis`}
                        >
                            {props.totalVotes} <span className="hidden md:inline">total</span> votes <span className="hidden lg:inline">worldwide</span>
                        </div>
                    }
                </div>
                
                {/* title */}
                <div 
                    className="text-[4vh] md:text-[5vh] text-black dark:text-white"
                >
                    <NavLink to='/'>karimerank</NavLink>
                </div>

                {/* nav dropdown */}
                <div className="relative flex flex-col items-end ml-4 mr-6 text-[2.5vh] md:text-[3.5vh]">
                    {/* current page navlink */}
                        <button
                            type="button"
                            className="group inline-flex flex-row justify-center items-center cursor-pointer text-black dark:text-white transition-opacity duration-150 hover:opacity-90 active:opacity-80"
                            onClick={() => setIsNavExpanded((prev) => !prev)}
                            aria-label={isNavExpanded ? "Collapse navigation" : "Expand navigation"}
                            aria-expanded={isNavExpanded}
                            aria-controls="navbar-available-paths"
                        >
                            <ExpandMore
                                className={`w-10 h-auto transition-transform duration-200 ${isNavExpanded ? "rotate-0" : "rotate-180"}`}
                            />
                            <span>{pathToPageName.get(location.pathname)}</span>
                        </button>

                    {/* other navlinks when dropdown open */}
                    {
                        <div 
                            id="navbar-available-paths"
                            className={`available-paths absolute top-full flex flex-col items-end ${isNavExpanded ? "open" : "closed"} z-20`}
                            aria-hidden={!isNavExpanded}    
                        >
                            { 
                                getAvailablePathsToPageNames(location.pathname).map(([path, pageName]) => {
                                    return <div key={path} className="text-[#8c8c8c] hover:text-black dark:hover:text-white">
                                        <NavLink to={path} tabIndex={isNavExpanded ? 0 : -1} onClick={() => setIsNavExpanded(false)}>{pageName}</NavLink>
                                    </div>
                                })
                            }
                        </div>
                    }
                </div>
                
            </div>
        </div>
    )
}

export default Navbar;
