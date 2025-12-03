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
        <div className="text-center w-full flex justify-center flex-row items-center">
            {location.pathname === "/rankings" && 
                <div 
                    className={`text-[2.5vh] md:text-[3.5vh] text-black dark:text-white absolute left-4 mx-1`}
                >
                    {props.totalVotes}<span className="hidden md:inline"> total</span> votes <span className="hidden lg:inline">worldwide</span>
                </div>
            }
            <div 
                className="flex justify-center items-center text-[4vh] md:text-[5vh] m-2 text-black dark:text-white"
            >
                <NavLink to='/'>karimerank</NavLink>
            </div>
            <div 
                className={`text-[2.5vh] md:text-[3.5vh] hover:text-black dark:hover:text-white absolute right-4 mx-4 ${getIsHighlighted("/rankings")}`}
            >
                <NavLink to="/rankings">Rankings</NavLink>
            </div>
        </div>
    </div>
)
}

export default Navbar;