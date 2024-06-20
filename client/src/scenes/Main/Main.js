import "./Main.css"
import { getIdolImagePair, likeImage } from "../../requests/images.js"
import heart from "../../assets/heart-filled.svg";
import { useState, useEffect } from "react";
// import Audio from "../../assets/bubble-sound.mp3";


const Main = () => {
    const [images, setImages] = useState([]);
    const [hasLiked, setHasLiked] = useState(0);

    const playAudio = () => {
        var audio = new Audio("/sounds/bubble-sound.mp3");
        audio.play();
    }
    
    useEffect(() => {
        fetchImages();
    }, [])

    const fetchImages = async () => {
        const imagePair = await getIdolImagePair();
        setImages([imagePair[0], imagePair[1]]);
        setHasLiked(0);
    }

    const selectImage = async (chosenImageId) => {
        const updatedImages = await likeImage(images[0]._id, images[1]._id, chosenImageId);
        setHasLiked(chosenImageId);
        playAudio();
        setTimeout(() => {
            fetchImages();
        }, 900);
    }

    return (
        <div className="Main">


            <div className=" flex flex-row justify-center">
                <h1 className="border-4 p-2 border-black md:text-[24px]">
                    Which Picture do you like more?
                </h1>
            </div>

            <div className="imagePair mt-8 flex flex-row flex-wrap justify-center gap-10">
                {images.map((image) => {
                    return (
                        <div className="relative" key={image._id}>
                            <img onClick={() => selectImage(image._id)} className="relative gap-6 hover:outline outline-[#FF0000] outline-4 w-auto lg:h-[60vh] md:h-[40vh] h-[35vh] cursor-pointer rounded-xl" src={image.imageUrl} alt={image.imageName} />
                            {(Boolean(hasLiked) && hasLiked === image._id) && <img className="heart absolute " src={heart} alt="like" />}
                        </div>
                    )
                })}
            </div>

            {/* <div className="flex flex-row justify-center"><button className="undoButton md:text-[24px] m-4 p-2 rounded-md border-4 border-black">Undo last selection</button></div> */}
        </div>
    )
}

export default Main;