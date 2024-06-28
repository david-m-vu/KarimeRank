import "./Main.css"
import { getIdolImagePair, getIdolImagePairByIdol, getAllIdolNames, likeImage } from "../../requests/images.js"
import heart from "../../assets/heart-filled.svg";
import { useState, useEffect } from "react";
// import Audio from "../../assets/bubble-sound.mp3";


const Main = () => {
    const [images, setImages] = useState([]);
    const [hasLiked, setHasLiked] = useState(0);
    const [showRecords, setShowRecords] = useState(false);
    const [firstNewStats, setFirstNewStats] = useState({});
    const [secondNewStats, setSecondNewStats] = useState({});
    const [selectedIdol, setSelectedIdol] = useState("Random");
    // const [imagesLoaded, setImagesLoaded] = useState(false);
    const [idolNames, setIdolNames] = useState([]);

    const playAudio = () => {
        var audio = new Audio("/sounds/bubble-sound.mp3");
        audio.play();
    }
    
    useEffect(() => {
        fetchAllIdolNames();
        fetchImages();
    }, [])

    useEffect(() => {
        fetchImages();
    }, [selectedIdol])

    const fetchImages = async () => {
        let imagePair
        if (selectedIdol.toLowerCase() === "random") {
            imagePair = await getIdolImagePair();
        } else {
            imagePair = await getIdolImagePairByIdol(selectedIdol);
        }
        setTimeout(() => {
            setImages([imagePair[0], imagePair[1]]);
            setHasLiked(0);
            setShowRecords(false);
        }, 1500)
    }

    const fetchAllIdolNames = async () => {
        const allIdolNames = await getAllIdolNames();
        setIdolNames(allIdolNames);
    }

    const selectImage = async (chosenImageId) => {
        if (!hasLiked) {
            setHasLiked(chosenImageId);
            playAudio();
            const updatedImages = await likeImage(images[0]._id, images[1]._id, chosenImageId);
            const { updatedFirstImage, updatedSecondImage } = updatedImages;

            // show stats on the bottom
            setFirstNewStats({id: updatedFirstImage._id, numLosses: updatedFirstImage.numLosses, numWins: updatedFirstImage.numWins, score: updatedFirstImage.score});
            setSecondNewStats({id: updatedSecondImage._id, numLosses: updatedSecondImage.numLosses, numWins: updatedSecondImage.numWins, score: updatedSecondImage.score})

            setShowRecords(true);

            // fetch new images
            fetchImages();
        }
    }

    const getImageStats = (imageID) => {
        if (firstNewStats.id === imageID) {
            return firstNewStats;
        } else if (secondNewStats.id === imageID) {
            return secondNewStats;
        } else {
            return {numWins: "", numLosses: "", score: ""};
        }
    }

    const handleSelect = (e) => {
        setSelectedIdol(e.target.value)
    } 

    function removeCaseInsensitiveDuplicates(arr) {
        // Create a new array to store unique strings in lowercase
        const uniqueStrings = [];
        
        // Filter the array
        const filteredArray = arr.filter((str) => {
          const lowerStr = str.toLowerCase();
          if (uniqueStrings.indexOf(lowerStr) === -1) {
            uniqueStrings.push(lowerStr);
            return true;
          }
          return false;
        });
      
        return filteredArray;
      }

    return (
        <div className="Main">
            <div className=" flex flex-row justify-center">
                <h1 className="border-4 p-2 border-black md:text-[24px]">
                    Which Picture do you like more?
                </h1>
            </div>
            <div className="flex flex-row justify-center items-center mt-2">
                <label>Filter: </label>

                <select name="idols" className="bg-white border-black border-2 rounded-md ml-2" onChange={handleSelect}>
                <option>Random</option>
                    {removeCaseInsensitiveDuplicates(idolNames).map((idolName, index) => {
                        return <option key={index}>{idolName}</option>
                    })}
                </select>
                
            </div>
            <div className="imagePair mt-5 md:mt-8 flex flex-row flex-wrap justify-center md:gap-10 gap-6">
                
                {images.map((image, index) => {
                    return (
                        <div className="relative" key={image._id}>
                            <img onClick={async () => {if(!hasLiked) await selectImage(image._id)}} className="relative md:hover:outline md:outline-[#FF0000] md:outline-3 w-auto lg:h-[60vh] md:h-[40vh] h-[35vh] cursor-pointer rounded-xl" src={image.imageUrl} alt={image.imageName} />
                            {(Boolean(hasLiked) && hasLiked === image._id) && <img className="heart absolute " src={heart} alt="like" />}
                            {showRecords && <div className={`bottom-[-2.5rem] md:bottom-[-3.5rem] lg:bottom-[-5rem] resultsInfo absolute p-4 text-[1rem] md:text-[1.5rem] lg:text-[2.5rem] w-[100vw]`}>{`W: ${getImageStats(image._id).numWins} L: ${getImageStats(image._id).numLosses} Score: ${getImageStats(image._id).score}`}</div>}
                        </div>
                    )
                })}
            </div>

            { <div className="text-center text-[1rem] md:text-[1.5rem] lg:text-[3rem] mt-4 lg:mt-12 md:mt-8 ">{images[0]?.idolName.replace(/[0-9]/g, '')}</div>}
            {/* <div className="flex flex-row justify-center" onClick={() => console.log(firstNewStats)}><button className="undoButton md:text-[24px] m-4 p-2 rounded-md border-4 border-black">Undo last selection</button></div> */}
        </div>
    )
}

export default Main;