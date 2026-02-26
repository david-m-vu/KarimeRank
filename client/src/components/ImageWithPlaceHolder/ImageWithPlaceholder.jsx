import "./ImageWithPlaceholder.css";
import { useEffect, useState, } from "react";

// react component that is a wrapper for an image
const ImageWithPlaceholder = ({ width, height, link, src, alt, idolName, withAnchor, handleImageLoad, onClick, className }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [placeholderColor, setPlaceholderColor] = useState("#686b5e")

    useEffect(() => {
        setPlaceholderColor(getRandomDullHslColor());
    }, [])

    const getRandomDullHslColor = () => {
        // Generate random hue (0-360)
        const hue = Math.floor(Math.random() * 361);
        // Set saturation to a low value to ensure dullness (e.g., 10-20%)
        const saturation = Math.floor(Math.random() * 11) + 10;
        // Set lightness to a low-medium value (e.g., 30-50%)
        const lightness = Math.floor(Math.random() * 21) + 30;
      
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    const getAspectRatio = () => {
        if (!width || !height) {
            return 0.6667;
        } else {
            return width / height;
        }
    }

    return (
        <div className="flex flex-row justify-center">
            { withAnchor ?
                <a href={link} target="_blank" rel="noreferrer" className="relative image-hover-container group">
                    <img className={`${className} ${isLoaded ? "block" : "hidden"}`} src={src} alt={alt} 
                        onLoad={() => {
                            setIsLoaded(true); 
                            handleImageLoad && handleImageLoad();
                        }}/>
                    {(isLoaded && idolName) && (
                        <div className="image-hover-overlay absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl md:border-4 border-2 border-black dark:border-gray-500">
                            <div className="text-white text-center md:text-[2rem] text-[1.2rem] font-bold z-10 px-4">
                                {idolName.replace(/[0-9]/g, '')}
                            </div>
                        </div>
                    )}
                </a>
                :
                <img className={`${className} ${isLoaded ? "block" : "hidden"}`} src={src} alt={alt} 
                    onLoad={() => {
                        setIsLoaded(true); 
                        handleImageLoad && handleImageLoad();
                    }}
                    onClick={onClick}
                />
            }

            {!isLoaded && (
                <div
                    className={`${className} loading-placeholder`}
                    style={{ backgroundColor: placeholderColor, aspectRatio: (getAspectRatio()) }}
                />
            )}
        </div>
    )
}

export default ImageWithPlaceholder;
