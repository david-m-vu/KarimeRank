import "./Main.css"
import { getIdolImagePair, getIdolImagePairByIdol, getAllIdolNamesWithGroup, likeImage } from "../../requests/images.js"
import heart from "../../assets/heart-filled.svg";
import { useState, useEffect } from "react";

import { useSpring, animated } from "react-spring"

const Main = () => {
    const [images, setImages] = useState([]);
    const [hasLiked, setHasLiked] = useState(0);
    const [showRecords, setShowRecords] = useState(false);

    const [firstNewStats, setFirstNewStats] = useState({});
    const [secondNewStats, setSecondNewStats] = useState({});
    const [winnerID, setWinnerID] = useState(-1);

    const [selectedIdol, setSelectedIdol] = useState("Random");
    const [idolGroups, setIdolGroups] = useState([]);

    const playAudio = () => {
        var audio = new Audio("/sounds/bubble-sound.mp3");
        audio.play();
    }

    useEffect(() => {
        fetchAllIdolGroups();
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
        }, 2500)
    }

    const fetchAllIdolGroups = async () => {
        const uniqueIdolGroups = await getAllIdolNamesWithGroup();
        setIdolGroups(uniqueIdolGroups);
    }

    const selectImage = async (chosenImageId) => {
        if (!hasLiked) {
            setHasLiked(chosenImageId);
            playAudio();

            // get new stats
            const updatedImages = await likeImage(images[0]._id, images[1]._id, chosenImageId);
            const { updatedFirstImage, updatedSecondImage } = updatedImages;

            setFirstNewStats({ id: updatedFirstImage._id, numLosses: updatedFirstImage.numLosses, numWins: updatedFirstImage.numWins, score: updatedFirstImage.score });
            setSecondNewStats({ id: updatedSecondImage._id, numLosses: updatedSecondImage.numLosses, numWins: updatedSecondImage.numWins, score: updatedSecondImage.score })

            setWinnerID(chosenImageId);
            setShowRecords(true);

            // fetch new images
            fetchImages();
        }
    }

    const getImageStats = (imageID) => {
        if (images[0]._id === imageID) {
            return firstNewStats;
        } else if (images[1]._id === imageID) {
            return secondNewStats;
        } else {
            return { numWins: "", numLosses: "", score: "" };
        }
    }

    const handleSelect = (e) => {
        setSelectedIdol(e.target.value)
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
                    {idolGroups.map((idolGroups, index) => {
                        return <option value={idolGroups.idolName} key={idolGroups.idolName}>{`${idolGroups.idolName.replace(/[0-9]/g, '')} (${idolGroups.groupName})`}</option>
                    })}
                </select>

            </div>
            <div className="imagePair mt-5 md:mt-8 flex flex-row flex-wrap justify-center md:gap-10 gap-6">

                {images.map((image, index) => {
                    return (
                        <div className="relative" key={image._id}>
                            <img onClick={async () => { if (!hasLiked) await selectImage(image._id) }} className="relative md:hover:outline md:outline-[#FF0000] md:outline-3 w-auto lg:h-[60vh] md:h-[40vh] h-[35vh] cursor-pointer rounded-xl" src={image.imageUrl} alt={image.imageName} />
                            {(Boolean(hasLiked) && hasLiked === image._id) && <img className="heart absolute " src={heart} alt="like" />}
                            {showRecords && <div className={`bottom-[-2.5rem] md:bottom-[-3.5rem] lg:bottom-[-4.5rem] resultsInfo absolute p-4 text-[1rem] md:text-[1.5rem] lg:text-[2.5rem] w-[100vw] flex flex-row items-start gap-[0.2rem] md:gap-[0.5rem] lg:gap-[1rem]`}>
                                <div>W:</div> 
                                {
                                    (images[index].numWins === getImageStats(image._id).numWins) ? <div>{images[index].numWins}</div> : <AnimatedNumber color="green" start={images[index].numWins} end={getImageStats(image._id).numWins}/>
                                }
                                 <div>L:</div>  
                                {
                                    (images[index].numLosses === getImageStats(image._id).numLosses) ? <div>{images[index].numLosses}</div> : <AnimatedNumber color="red" start={images[index].numLosses} end={getImageStats(image._id).numLosses}/>
                                }                                
                                 <div>Score:</div>  <AnimatedNumber color={winnerID === image._id ? "green" : "red"} start={images[index].score} end={getImageStats(image._id).score}/>
                                          
                                </div>}
                        </div>
                    )
                })}
            </div>

            {<div className="text-center text-[1rem] md:text-[1.5rem] lg:text-[3rem] mt-4 lg:mt-12 md:mt-8 ">{`${images[0]?.idolName.replace(/[0-9]/g, '') || ""} `}</div>}
            {/* <div className="flex flex-row justify-center" onClick={() => console.log(selectedIdol)}><button className="undoButton md:text-[24px] m-4 p-2 rounded-md border-4 border-black">Undo last selection</button></div> */}
        </div>
    )
}

const AnimatedNumber = ({ color, start, end }) => {
    const getNumberClassName = () => {
        if (color === "green") {
            return "text-[#77dd77]"
        } else if (color === "red") {
            return "text-[#FF6961]"
        } else {
            return "";
        }
    }
    
    const { number } = useSpring({
        from: { number: start},
        number: end,
        delay: 50,
        config: { mass: 1, tension: 20, friction: 10 },
    });
    return <animated.div className={`${getNumberClassName()} animatedNumber`}>{number.to((n) => n.toFixed(0))}</animated.div>
}

export default Main;