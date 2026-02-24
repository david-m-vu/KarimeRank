import "./Main.css"
import { getIdolImagePair, getIdolImagePairByIdol, getAllIdolNamesWithGroup, likeImage } from "../../requests/images.js"
import { useState, useEffect, useCallback } from "react";
import { useSpring, animated } from "react-spring"

import heart from "../../assets/heart-filled.svg";

const Main = () => {
    const [images, setImages] = useState([]);
    const [hasLiked, setHasLiked] = useState(0);
    const [showRecords, setShowRecords] = useState(false);

    const [firstNewStats, setFirstNewStats] = useState({});
    const [secondNewStats, setSecondNewStats] = useState({});
    const [winnerID, setWinnerID] = useState(-1);

    const [selectedIdol, setSelectedIdol] = useState("Random");
    const [idolGroups, setIdolGroups] = useState([]);

    const [isLoadingMain, setIsLoadingMain] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState(0);

    const playAudio = () => {
        var audio = new Audio("/sounds/bubble-sound.mp3");
        audio.play();
    }

    // pass willDelay as false if initial mount
    const fetchImages = useCallback(async (willDelay) => {
        let imagePair;

        // this indicates that we just started the app
        if (!willDelay) {
            setImagesLoaded(0);
            setIsLoadingMain(true);
        }
        if (selectedIdol.toLowerCase() === "random") {
            imagePair = await getIdolImagePair();
        } else {
            imagePair = await getIdolImagePairByIdol(selectedIdol);
        }

        if (imagePair) {
            if (willDelay) {
                setTimeout(() => {
                    setImagesLoaded(0);
                    setIsLoadingMain(true);
                    setImages([imagePair[0], imagePair[1]]);
                    setHasLiked(0);
                    setShowRecords(false);
                }, 2500)
            } else {
                setImages([imagePair[0], imagePair[1]]);
                setHasLiked(0);
                setShowRecords(false);
            }
        }
    }, [selectedIdol])

    // fetch idol groups on initial render
    useEffect(() => {
        const fetchAllIdolGroups = async () => {
            const uniqueIdolGroups = await getAllIdolNamesWithGroup();
            setIdolGroups(uniqueIdolGroups);
        }
        fetchAllIdolGroups();
    }, [])

    // fetch images on initial render and when selected idol changes
    useEffect(() => {
        fetchImages(false);
    }, [fetchImages])

    // if all (2) images have loaded, set isLoadingMain to false
    useEffect(() => {
        if (images.length !== 0 && imagesLoaded >= images.length) {
          console.log('All images loaded');
          setIsLoadingMain(false);
        } 
      }, [imagesLoaded, images.length]);

    const handleImageLoad = () => {
        setImagesLoaded(prev => prev + 1);
    };

    const selectImage = async (chosenImageId) => {
        if (!hasLiked) {
            setHasLiked(chosenImageId);
            playAudio();

            // get new stats
            const updatedImages = await likeImage(images[0].id, images[1].id, chosenImageId);
            const { updatedFirstImage, updatedSecondImage } = updatedImages;

            setFirstNewStats({ id: updatedFirstImage.id, numLosses: updatedFirstImage.numLosses, numWins: updatedFirstImage.numWins, score: updatedFirstImage.score });
            setSecondNewStats({ id: updatedSecondImage.id, numLosses: updatedSecondImage.numLosses, numWins: updatedSecondImage.numWins, score: updatedSecondImage.score })

            setWinnerID(chosenImageId);
            setShowRecords(true);

            // fetch new images
            fetchImages(true);
        }
    }

    const getImageStats = (imageID) => {
        if (images[0].id === imageID) {
            return firstNewStats;
        } else if (images[1].id === imageID) {
            return secondNewStats;
        } else {
            return { numWins: "", numLosses: "", score: "" };
        }
    }

    const handleSelect = (e) => {
        setSelectedIdol(e.target.value)
    }

    return (
        <div className="Main flex-1">
            <div className=" flex flex-row justify-center">
                <h1 className="border-4 p-2 border-black dark:border-white text-[2.5vh] md:text-[3vh] dark:text-white">
                    Which Picture do you like more?
                </h1>
            </div>
            <div className="flex flex-row justify-center items-center mt-2">
                <label className="dark:text-white text-[2vh] md:text-[2.5vh]">Filter: </label>

                <select name="idols" className="bg-white dark:bg-black border-black dark:border-white dark:text-white border-2 rounded-md ml-2 text-[1vh] md:text-[2vh]" onChange={handleSelect}>
                    <option>Random</option>
                    {idolGroups.sort((a, b) => {
                        // need to do this because you cant subtract two strings
                        if (a.groupName > b.groupName) {
                            return 1;
                        } else if (a.groupName < b.groupName) {
                            return -1;
                        } else {
                            return 0;
                        }
                    }).map((idolGroups, index) => {
                        return <option value={idolGroups.idolName} key={idolGroups.idolName}>{`${idolGroups.idolName.replace(/[0-9]/g, '')} (${idolGroups.groupName})`}</option>
                    })}
                </select>

            </div>
            <div className="mt-4 md:mt-8 flex flex-row flex-wrap justify-center md:gap-x-10 md:gap-y-12 gap-y-6 gap-x-4">

                {images.map((image, index) => {
                    return (
                        <div className="inline-flex flex-col items-start min-w-0 relative mb-4 md:mb-9 lg:mb-11" key={image.id}>
                            <div className="relative">
                                <img onClick={async () => { if (!hasLiked) await selectImage(image.id) }} 
                                    className="md:hover:outline md:outline-[#FF0000] md:outline-3 w-auto xl:h-[60vh] 
                                                lg:h-[40vh] md:h-[40vh] h-[35vh] cursor-pointer rounded-xl block" 
                                    src={image.url} 
                                    alt={image.imageName} 
                                    onLoad={() => {
                                        handleImageLoad();
                                    }}
                                />
                                {(Boolean(hasLiked) && hasLiked === image.id) && <img className="heart absolute" src={heart} alt="like" />}
                                {showRecords && 
                                <div className={`updateText absolute z-30 top-0 text-[1rem] md:text-[1.5rem] lg:text-[2.5rem] ${images[index].numWins === getImageStats(image.id).numWins ? "text-[#FF6961]" : "text-[#77dd77]"}`}>
                                    {showRecords && ((images[index].numWins === getImageStats(image.id).numWins) ? '-' : '+')}{Math.abs(getImageStats(image.id).score - images[index].score)}
                                </div>}
                            </div>
                            
                            {/* stats */}
                            <div className="w-0 min-w-full mt-1 md:mt-2 min-h-8 md:min-h-12 lg:min-h-20 xl:absolute xl:top-full">
                                {showRecords && 
                                <div className={`resultsInfo w-full min-w-0 text-[1rem] md:text-[1.5rem] lg:text-[2.5rem] leading-[1rem] md:leading-[1.5rem] lg:leading-[2.5rem]
                                                flex flex-row flex-wrap items-center gap-x-[0.2rem] md:gap-x-[0.5rem] 
                                                lg:gap-x-[1rem] p-0 whitespace-normal break-words dark:text-white`}>
                                    <div>W:</div> 
                                    {
                                        (images[index].numWins === getImageStats(image.id).numWins) ? <div>{images[index].numWins}</div> : <AnimatedNumber color="green" start={images[index].numWins} end={getImageStats(image.id).numWins}/>
                                    }
                                    <div>L:</div>  
                                    {
                                        (images[index].numLosses === getImageStats(image.id).numLosses) ? <div>{images[index].numLosses}</div> : <AnimatedNumber color="red" start={images[index].numLosses} end={getImageStats(image.id).numLosses}/>
                                    }                                
                                    <div>Score:</div>  
                                    <AnimatedNumber color={winnerID === image.id ? "green" : "red"} start={images[index].score} end={getImageStats(image.id).score}></AnimatedNumber>
                                </div>
                                }
                            </div>
                        </div>
                    )
                })}
            </div>

            {isLoadingMain &&
                <div className="loadingMain fixed bottom-4 left-4 rounded-[50%] w-14 h-14 border-[#067c91] dark:border-[#72d3e4] border-8 border-l-transparent border-r-transparent dark:border-l-transparent dark:border-r-transparent"></div>
            }

            {<div className="text-center text-[2vh] md:text-[3vh] lg:text-[5vh] dark:text-white ">{`${images[0]?.idolName.replace(/[0-9]/g, '') || ""} `}</div>}
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
