import "./PrimaryButton.css"

const PrimaryButton = ({ children, className="", type = "button", onClick, ...props }) => {
    return (
        <button 
            className={`bg-[#fffff0] dark:bg-[#2c2c2c] border border-black dark:border-white text-nowrap hover:bg-[#f5f5e5] dark:hover:bg-[#3a3a3a] transition-colors duration-75
                active:scale-[99%] disabled:hover:bg-inherit disabled:active:scale-100 disabled:opacity-50 ${className}`} 
            type={type} 
            onClick={onClick} 
            {...props}
        >
            {children}
        </button>
    )    
}

export default PrimaryButton;
