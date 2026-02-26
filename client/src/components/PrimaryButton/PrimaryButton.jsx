import "./PrimaryButton.css"

const PrimaryButton = ({ children, className="", type = "button", onClick, ...props }) => {
    return (
        <button 
            className={`bg-[#fffff0] dark:bg-[#2c2c2c] border border-black dark:border-white text-nowrap hover:bg-[#f5f5e5] dark:hover:bg-[#3a3a3a] duration-75
                transition-colors transition-transform active:scale-[99%] active:bg-[#eaeadb] dark:active:bg-[#474747] disabled:active:bg-inherit disabled:hover:bg-inherit disabled:active:scale-100 disabled:opacity-50 ${className}`} 
            type={type} 
            onClick={onClick} 
            {...props}
        >
            {children}
        </button>
    )    
}

export default PrimaryButton;
