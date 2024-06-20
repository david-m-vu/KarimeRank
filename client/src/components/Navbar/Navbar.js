import "./Navbar.css"

const Navbar = () => {
    return (
        <div className="Navbar">
            <div className="text-center w-full flex justify-center flex-row items-center ">
                <div className=" flex justify-center text-[62px]"><a href='/'>karimerank</a></div>
                <div className="text-[32px] absolute right-4 mx-4"> Rankings</div>
            </div>
        </div>
    )
}

export default Navbar;