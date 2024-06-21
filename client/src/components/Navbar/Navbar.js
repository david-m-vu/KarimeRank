import "./Navbar.css"
import { NavLink, useLocation } from "react-router-dom"
import { useEffect } from "react";

const Navbar = (props) => {
    const location = useLocation();

    useEffect(() => {
        console.log(location.pathname);
    }, [])
    
    const getIsHighlighted = (path) => {
        if (path === location.pathname) {
            return "text-black";
        } else {
            return "text-[#8c8c8c]"
        }
    }
    
    return (
        <div className="Navbar">
            <div className="text-center w-full flex justify-center flex-row items-center">
                
                {location.pathname === "/rankings" && <div className={`md:text-[32px] text-[15px] text-black absolute left-4 mx-4`}>{props.totalVotes}<span className="hidden lg:inline"> total</span> votes <span className="hidden lg:inline">worldwide</span></div>}
                <div>

                </div>
                <div className=" flex justify-center items-center md:text-[3.875rem] text-[2rem] m-2 text-black"><NavLink to='/'>karimerank</NavLink></div>
                <div className={`md:text-[32px] text-[20px] hover:text-black absolute right-4 mx-4 ${getIsHighlighted("/rankings")}`}><NavLink to="/rankings">Rankings</NavLink></div>
            </div>
        </div>
    )
}

export default Navbar;