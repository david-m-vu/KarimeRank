import "./PrimaryButton.css"

const PrimaryButton = ({ children, className="", type = "button", onClick, ...props }) => {
    return (
        <button id="primary-button" 
            className={`bg-[#fffff0] dark:bg-[#2c2c2c] border border-black text-nowrap hover:bg-[#f5f5e5] transition-colors duration-75
                active:scale-[99%] ${className}`} 
            type={type} 
            onClick={onClick} 
            {...props}
        >
            {children}
        </button>
    )    
}

export default PrimaryButton;
