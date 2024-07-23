import "./Rankings.css"
import { getTotalVotes, getAllIdolNamesWithGroup, getStartToEndImages, generateImagesByIdol, deleteImageById } from "../../requests/images.js"
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import closeIcon from "../../assets/close.svg";
import crown from "../../assets/crown.png"

const Rankings = (props) => {
    const [images, setImages] = useState([]);
    const [start, setStart] = useState(0);
    const [isBottom, setIsBottom] = useState(false);
    const [searchMore, setSearchMore] = useState(true);
    const [isLoadingMain, setIsLoadingMain] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState(0);
    const [showEndIndicator, setShowEndIndicator] = useState(false);

    const [resultMsg, setResultMsg] = useState("");
    const [idolNameInput, setIdolNameInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [addInputFocused, setAddInputFocused] = useState(false);

    const [idolGroups, setIdolGroups] = useState([]);
    const [queryParameters] = useSearchParams();
    const [daysUntilNextMonth, setDaysUntilNextMonth] = useState("X");

    const [isDeleting, setIsDeleting] = useState(false);

    const navigate = useNavigate();

    let mybutton = document.getElementById("myBtn");

    useEffect(() => {
        window.addEventListener("scroll", handleScroll)
        fetchAllIdolGroups();
        retrieveTotalVotes();
        getDaysUntilNextMonth();

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
                // console.log("done")
                setShowEndIndicator(true);
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

    const handleCheck = (e) => {
        setIsDeleting(e.target.checked);
    }

    const handleDelete = async (imageId) => {
        const deletedImage = (await deleteImageById(imageId)).deletedImage;

        const newImages = images.filter((image) => {
            return image._id !== imageId;
        })
        setImages(newImages);
        setStart((prev) => prev - 1)

        console.log(deletedImage);
    }

    const getDaysUntilNextMonth = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

        const firstDayOfNextMonth = new Date(nextMonthYear, nextMonth, 1);

        const diffInMs = firstDayOfNextMonth - today;
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

        setDaysUntilNextMonth(diffInDays);
        // return diffInDays
    }

    const getDaysCountClass = () => {
        if (daysUntilNextMonth > 19) {
            return "text-[#9ff7a5]"
        } else if (daysUntilNextMonth > 9) {
            return "dark:text-[#ded380] text-[#fcba03]"
        } else if (daysUntilNextMonth > 4) {
            return "text-[#c280a8]"
        } else {
            return "text-[#ff5770]"
        }
    }

    const getRankOneStyle = (index) => {
        if (index === 0) {
            return `${!isDeleting && "idolCardRankOne"} shadow-[#fcba03] bg-gradient-to-r from-[#fcba03] to-[#de7134]`
        } else {
            return `${!isDeleting && "idolCard"}`
        }
    }

    return (
        <div className={`Rankings relative`}>
            <div className="flex flex-col items-center">
                <div className="flex justify-center mb-5 z-10 relative w-full flex-col items-center md:flex-row md:gap-7 gap-4">
                    {addInputFocused && <div className="contextMsg z-20 absolute text-black dark:text-white"><span className="decoration-solid underline">SOURCE</span>: https://kpopping.com/profiles/idol/<span className="text-purple-700 dark:text-purple-300">[IDOL NAME HERE]</span></div>}
                    <input className={`bg-black w-4/5 md:w-[25%] lg:w-1/5 text-white bg-opacity-50 rounded-md text-center p-[0.5rem] text-[1.5rem] `} onFocus={() => setAddInputFocused(true)} onBlur={() => setAddInputFocused(false)} onKeyDown={handleSearch} placeholder="Add Idol (Ex: Winter)" value={idolNameInput} onChange={handleIdolNameInputChange} type="text" name="search"></input>
                    <div className="resultMsg absolute">{resultMsg}</div>

                    <div className="flex flex-row justify-center items-center">
                        <label className="md:text-[2rem] text-[1.5rem] dark:text-white">Filter: </label>
                        <select name="idols" className="bg-white dark:bg-black dark:text-white border-black dark:border-white border-2 rounded-md ml-2 md:text-[1.5rem] text-[1rem] p-[0.1rem]" value={queryParameters.get("filter") || "All"} onChange={handleSelect}>
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

                <div className="flex flex-row gap-4">
                    <label className="md:text-[1.5rem] text-[1rem] dark:text-white" checked={isDeleting} htmlFor="deleting">Delete Mode:</label>
                    <input id="deleting" type="checkbox" checked={isDeleting} onChange={handleCheck}></input>
                </div>

                <div className={`md:text-[2rem] min-[1320px]:absolute md:right-4 md:mx-4 text-[1.5rem] dark:text-white`}>
                    NEW IMAGE CYCLE IN <span className={getDaysCountClass()}>{daysUntilNextMonth}</span> DAY<span className={daysUntilNextMonth === 1 ? "hidden" : "inline"}>S</span>
                </div>

            </div>

            {/* message if user doesn't see any images */}
            {(images.length === 0 && !isLoadingMain) && <div className="noImagesMessage text-center text-2xl md:text-4xl mt-40">
                Don't see any images? try reloading!
            </div>}

            <div className="flex flex-row flex-wrap gap-3 md:gap-6 md:p-8 p-4 justify-center">
                {images.map((image, index) => {
                    return (
                        <div key={image._id} className={`relative rounded-xl p-1 dark:bg-black bg-white dark:text-white shadow-2xl mt-6 ${getRankOneStyle(index)}`}>
                            <ImageWithPlaceHolder src={image.imageUrl} alt={image.imageName} handleImageLoad={handleImageLoad} width={image.width} height={image.height} />
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

                            {isDeleting && <div className="cursor-pointer" onClick={() => handleDelete(image._id)}>
                                <img src={closeIcon} className="absolute right-[0.5rem] bottom-[0.5rem]" alt="close-icon"></img>
                            </div>}

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
                <div className="loadingMain fixed bottom-4 left-4 rounded-[50%] w-14 h-14 border-[#067c91] dark:border-[#72d3e4] border-8 border-l-transparent border-r-transparent dark:border-l-transparent dark:border-r-transparent"></div>
            }

            {(showEndIndicator && images.length !== 0) &&
                <div className="eolMessage flex justify-center md:text-[2rem] text-[1.5rem] dark:text-white pb-8">END OF LIST</div>
            }

            <button id="myBtn" onClick={() => topFunction()} className="fixed md:bottom-[20px] bottom-[10px] right-[10px] md:right-[30px] display-hidden text-white m-4 text-[2rem] z-99 rounded-full px-4 bg-gray-700 shadow-2xl">↑</button>
            {isDeleting && <div className="w-dvw h-dvh fixed inset-0 z-20 bg-[#ff4760] opacity-20 pointer-events-none"></div>}

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
            <img className={`box-border md:border-4 border-2 border-black dark:border-gray-500 md:h-[20rem] h-[10rem] rounded-xl ${isLoaded ? "block" : "hidden"}`} src={props.src} alt={props.alt}
                onLoad={() => {
                    setIsLoaded(true);
                    props.handleImageLoad();
                }} />
            {!isLoaded && <div className={`box-border md:border-4 border-2 border-black dark:border-gray-500 md:h-[20rem] h-[10rem] rounded-xl`} style={{ backgroundColor: placeholderColor, aspectRatio: (getAspectRatio()) }} />}
        </div>
    )
}

export default Rankings;