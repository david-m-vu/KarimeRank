import "./Rankings.css"
import { getTotalVotes, getAllIdolNamesWithGroup, getStartToEndImages, generateImagesByIdol } from "../../requests/images.js"
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import crown from "../../assets/crown.png"

const Rankings = (props) => {
    const [images, setImages] = useState([]);
    const [start, setStart] = useState(0);
    const [isBottom, setIsBottom] = useState(false);
    const [searchMore, setSearchMore] = useState(true);
    const [isLoadingMain, setIsLoadingMain] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState(0);

    const [resultMsg, setResultMsg] = useState("");
    const [idolNameInput, setIdolNameInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [addInputFocused, setAddInputFocused] = useState(false);

    const [idolGroups, setIdolGroups] = useState([]);

    const [queryParameters] = useSearchParams();
    const navigate = useNavigate();

    let mybutton = document.getElementById("myBtn");

    useEffect(() => {
        window.addEventListener("scroll", handleScroll)
        fetchAllIdolGroups();
        retrieveTotalVotes();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [])

    // trigger fetch when user selects a new idol
    useEffect(() => {
        // console.log(`filter: ${queryParameters.get("filter")}`);
        fetchImages(queryParameters.get("filter"));
    }, [queryParameters])

    // trigger fetch when user reaches the bottom of the page
    useEffect(() => {
        if (isBottom) {
            fetchImages(queryParameters.get("filter")).then((value) => {
                setIsBottom(false);
            })
        }
    }, [isBottom])

    useEffect(() => {
        if (images.length !== 0 && imagesLoaded === images.length) {
        //   console.log('All images loaded');
          setIsLoadingMain(false);
        } 
      }, [imagesLoaded, images.length]);

    const handleImageLoad = () => {
        setImagesLoaded(prev => prev + 1);
    };

    function scrollFunction() {
        if (document.body.scrollTop > 2000 || document.documentElement.scrollTop > 2000) {
            mybutton.style.display = "block";
        } else {
            mybutton.style.display = "none";
        }
    }
    window.onscroll = function () { scrollFunction() };

    const topFunction = () => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    const handleScroll = (e) => {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollTop + windowHeight >= documentHeight - 5) {
            setIsBottom(true);
        }
    }

    const fetchImages = async (idolName) => {
        if (searchMore) {
            // console.log("fetching");
            setIsLoadingMain(true);
            const newImages = await getStartToEndImages(start, 20, idolName);

            if (newImages.length !== 0) {
                setStart((prev) => prev + 20);
                setImages((prev) => [...prev, ...newImages])
            } else {
                setSearchMore(false);
                setIsLoadingMain(false);
            }
        }
    }

    const fetchAllIdolGroups = async () => {
        const uniqueIdolGroups = await getAllIdolNamesWithGroup();
        setIdolGroups(uniqueIdolGroups);
    }

    const retrieveTotalVotes = async () => {
        const totalVotes = await getTotalVotes();
        props.setTotalVotes(totalVotes);
    }

    const handleIdolNameInputChange = (e) => {
        setIdolNameInput(e.target.value)
    }

    const handleSearch = async (e) => {
        if (idolNameInput !== "" && (e.keyCode === 13)) {
            setIsLoading(true);
            const allImagesJSON = await generateImagesByIdol(idolNameInput);

            let message;
            if (Object.hasOwn(allImagesJSON, "message")) {
                message = allImagesJSON.message;
            } else {
                message = `${allImagesJSON.imagesAdded} images added`;
            }

            setResultMsg(message);
            setIsLoading(false);
            setIdolNameInput("");
            setTimeout(() => {
                setResultMsg("");
            }, 3000)
        }
    }

    const handleSelect = (e) => {
        navigate(`/rankings?filter=${e.target.value}`)
        setSearchMore(true);
        setStart(0);
        setImages([]);
        setImagesLoaded(0);
    }

    const getRankOneStyle = (index) => {
        if (index === 0) {
            return "idolCardRankOne shadow-[#fcba03] bg-gradient-to-r from-[#fcba03] to-[#de7134]"
        } else {
            return "idolCard"
        }
    }

    return (
        <div className="Rankings relative">
            <div className="flex justify-center mb-5 z-10 relative w-full flex-col items-center md:flex-row md:gap-4 gap-8">
                {addInputFocused && <div className="contextMsg z-20 absolute text-black"><span className="decoration-solid underline">SOURCE</span>: https://kpopping.com/profiles/idol/<span className="text-purple-700">[IDOL NAME HERE]</span></div>}
                <input className={`bg-black w-4/5 md:w-[25%] lg:w-1/5 text-white bg-opacity-50 rounded-md text-center p-[0.5rem] text-[1.5rem] `} onFocus={() => setAddInputFocused(true)} onBlur={() => setAddInputFocused(false)} onKeyDown={handleSearch} placeholder="Add Idol (Ex: Winter)" value={idolNameInput} onChange={handleIdolNameInputChange} type="text" name="search"></input>
                <div className="resultMsg absolute">{resultMsg}</div>

                <div className="flex flex-row justify-center items-center">
                    <label className="text-[24px]">Filter: </label>

                    <select name="idols" className="bg-white border-black border-2 rounded-md ml-2 text-[1.5rem] p-[0.1rem]" value={queryParameters.get("filter") || "All"} onChange={handleSelect}>
                        <option>All</option>
                        {idolGroups.sort((a, b) => {
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
            </div>

            {/* message if user doesn't see any images */}
            {(images.length === 0 && !isLoadingMain) && <div className="noImagesMessage text-center text-2xl md:text-4xl mt-40">
                Don't see any images? try reloading!
            </div>}

            <div className="flex flex-row flex-wrap gap-3 md:gap-6 flex-wrap md:p-8 p-4 justify-center">
                {images.map((image, index) => {
                    return (
                        <div key={image._id} className={`relative rounded-xl p-1 bg-white shadow-2xl mt-6 ${getRankOneStyle(index)}`}>
                            <ImageWithPlaceHolder src={image.imageUrl} alt={image.imageName} handleImageLoad={handleImageLoad} width={image.width} height={image.height}/>
                            {/* <div>{image.idolName}</div> */}
                            <div className="flex flex-row items-center md:gap-4 flex-wrap">
                                <div className="md:text-[2.5rem] text-[1rem] rankNumber">{index + 1}.</div>
                                <div className="flex flex-col justify-center flex-1 items-center">
                                    <div className="text-center text-[1rem] md:text-[1.5rem]">W: {image.numWins} L: {image.numLosses}</div>
                                    <div className="text-center text-[0.7rem] md:text-[1rem]">
                                        Score: {image.score}
                                    </div>
                                </div>
                            </div>
                            {index === 0 && <img className="absolute lg:w-[8rem] md:w-[8rem] w-[4rem] h-auto lg:top-[-6rem] md:top-[-6rem] top-[-3rem] left-[50%] translate-x-[-50%]" src={crown} alt="crown" />}
                        </div>
                    )

                }
                )}
            </div>
            {isLoading &&
                <div className="loadingScreen">
                    <div className="loader">
                    </div>
                    <div className="darkOverlay">
                    </div>
                </div>
            }

            {isLoadingMain &&
                <div className="loadingMain fixed bottom-4 left-4 rounded-[50%] w-14 h-14 border-[#067c91] border-8 border-l-transparent border-r-transparent"></div>
            }

            <button id="myBtn" onClick={() => topFunction()} className="fixed md:bottom-[20px] bottom-[10px] right-[10px] md:right-[30px] display-hidden text-white m-4 text-[2rem] z-99 rounded-full px-4 bg-gray-700 shadow-2xl">↑</button>
        </div>
    )
}

const ImageWithPlaceHolder = (props) => {
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
        if (!props.width || !props.height) {
            return 0.6667;
        } else {
            return props.width / props.height;
        }
    }

    return (
        <div className="flex flex-row justify-center">
            <img className={`box-border md:border-4 border-2 border-black md:h-[20rem] h-[10rem] rounded-xl ${isLoaded ? "block" : "hidden"}`} src={props.src} alt={props.alt} 
                onLoad={() => {
                    setIsLoaded(true); 
                    props.handleImageLoad();
                }}/>
            {!isLoaded && <div className={`box-border md:border-4 border-2 border-black md:h-[20rem] h-[10rem] rounded-xl`} style={{ backgroundColor: placeholderColor, aspectRatio: (getAspectRatio()) }}/>}
        </div>
    )
}

export default Rankings;