import "./Navbar.css"
import { NavLink } from "react-router-dom"

const Navbar = () => {
    return (
        <div className="Navbar">
            <div className="text-center w-full flex justify-center flex-row items-center ">
                <div className=" flex justify-center items-center md:text-[3.875rem] text-[2rem] m-2"><NavLink to='/'>karimerank</NavLink></div>
                <div className="md:text-[32px] text-[20px] absolute right-4 mx-4"><NavLink to="/rankings">Rankings</NavLink></div>
            </div>
        </div>
    )
}

export default Navbar;