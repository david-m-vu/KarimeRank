import "./Navbar.css"
import { NavLink, useLocation } from "react-router-dom"

const Navbar = (props) => {
    const location = useLocation();

    const getIsHighlighted = (path) => {
        if (path === location.pathname) {
            return "text-black dark:text-white";
        } else {
            return "text-[#8c8c8c]"
        }
    }

    return (
        <div className="Navbar">
        <div className="w-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center py-2">
            <div className="min-w-0 mx-4"> {/* this wrapper keeps a permanent first grid cell, so the title stays centered on all pages*/}
                {location.pathname === "/rankings" && 
                    <div 
                        className={`text-[2.5vh] md:text-[3.5vh] text-black dark:text-white whitespace-nowrap overflow-hidden text-ellipsis`}
                    >
                        {props.totalVotes} <span className="hidden md:inline">total</span> votes <span className="hidden lg:inline">worldwide</span>
                    </div>
                }
            </div>
            
            <div 
                className="text-[4vh] md:text-[5vh] text-black dark:text-white"
            >
                <NavLink to='/'>karimerank</NavLink>
            </div>
            <div 
                className={`justify-self-end text-[2.5vh] md:text-[3.5vh] hover:text-black dark:hover:text-white mx-4 ${getIsHighlighted("/rankings")}`}
            >
                <NavLink to="/rankings">Rankings</NavLink>
            </div>
        </div>
    </div>
)
}

export default Navbar;