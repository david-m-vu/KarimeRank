import "./Rankings.css"
import { getAllImages, generateImagesByIdol } from "../../requests/images.js"
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import crown from "../../assets/crown.png"

const Rankings = (props) => {
    const [images, setImages] = useState([]);
    const [resultMsg, setResultMsg] = useState("");
    const [idolNameInput, setIdolNameInput] = useState("");
    const [filterInput, setFilterInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [addInputFocused, setAddInputFocused] = useState(false);
    const [filterInputFocused, setFilterInputFocused] = useState(false);

    const [queryParameters] = useSearchParams();
    const navigate = useNavigate();

    let mybutton = document.getElementById("myBtn");
    useEffect(() => {
        fetchImages();
    }, [])
    
    function scrollFunction() {
        if (document.body.scrollTop > 2000 || document.documentElement.scrollTop > 2000) {
          mybutton.style.display = "block";
        } else {
          mybutton.style.display = "none";
        }
      }
      window.onscroll = function() {scrollFunction()};

    const topFunction = () => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    const fetchImages = async () => {
        console.log("fetching");
        const allImages = await getAllImages();
        const totalWinsLosses = allImages.reduce(( accumulator, current) => {
            return accumulator + current.numWins + current.numLosses;
        }, 0)
        props.setTotalVotes(Math.floor(totalWinsLosses / 2));

        const allImagesSorted = allImages.sort((a, b) => {
            return b.score - a.score;
        })
        setImages(allImagesSorted);
    }

    const handleIdolNameInputChange = (e) => {
        setIdolNameInput(e.target.value)
    }

    const handleFilterInputChange = (e) => {
        setFilterInput(e.target.value.toLowerCase())
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

    const handleFilter = (e) => {
        if (e.keyCode === 13) {
            navigate(`/rankings?filter=${e.target.value}`)
        }
    }

    const getRankOneStyle = (index) => {
        if (index === 0) {
            return "shadow-[#fcba03] bg-gradient-to-r from-[#fcba03] to-[#de7134]"
        }
    }

    return (
        <div className="Rankings relative">
            <div className="flex justify-center mb-5 z-10 relative w-full flex-col items-center md:flex-row md:gap-4 gap-8">
                {addInputFocused && <div className="contextMsg z-20 absolute text-black"><span className="decoration-solid	underline">SOURCE</span>: https://kpopping.com/profiles/idol/<span className="text-purple-700">[IDOL NAME HERE]</span></div>}
                <input className={`bg-black w-4/5 md:w-[25%] lg:w-1/5 text-white bg-opacity-50 rounded-md text-center p-[0.5rem] text-[1.5rem] `} onFocus={() => setAddInputFocused(true)} onBlur={() => setAddInputFocused(false)} onKeyDown={handleSearch} placeholder="Add Idol (Ex: Winter)" value={idolNameInput} onChange={handleIdolNameInputChange} type="text" name="search"></input>
                <div className="resultMsg absolute">{resultMsg}</div>

                <input className={`right-[2rem] bg-black w-4/5 md:w-1/5 lg:w-1/5 text-white bg-opacity-50 rounded-md text-center p-[0.5rem] text-[1.5rem]`} onFocus={() => setFilterInputFocused(true)} onBlur={() => setFilterInputFocused(false)} onKeyDown={handleFilter} placeholder="FILTER" value={filterInput} onChange={handleFilterInputChange} type="text" name="filter"></input>
                <h1 className="border-4 p-2 border-black md:text-[24px] hover:bg-[#fcba03] cursor-pointer" onClick={() => {navigate("/rankings"); setFilterInput("")}}>
                    ALL
                </h1>

                
            </div>
            <div className="images flex flex-row gap-3 md:gap-6 flex-wrap md:p-8 justify-center">
                {images.map((image, index) => {
                    if ((image.idolName.toLowerCase().includes(queryParameters.get("filter") || ""))) {
                        return (
                            <div key={image._id} className={`relative rounded-xl p-1 bg-white shadow-2xl mt-6 ${getRankOneStyle(index)}`}>
                                <div className="flex flex-row justify-center">
                                    <img className=" md:border-4 border-2 border-black md:h-[20rem] h-[10rem] rounded-xl" src={image.imageUrl} alt={image.imageName} />
                                </div>
                                {/* <div>{image.idolName}</div> */}
                                <div className="flex flex-row items-center md:gap-4 flex-wrap">
                                    <div className=" md:text-[2.5rem] text-[1rem] rankNumber">{index + 1}.</div>
                                    <div className="flex flex-col justify-center flex-1 items-center">
                                        <div className="text-center text-[1rem] md:text-[1.5rem]">W: {image.numWins} L: {image.numLosses}</div>
                                        <div className="text-center text-[0.7rem] md:text-[1rem]">
                                            Score: {image.score}
                                        </div>
                                    </div>
                                </div>
                                {index === 0 && <img className="absolute lg:w-[8rem] md:w-[8rem] w-[4rem] h-auto lg:top-[-6rem] md:top-[-6rem] top-[-3rem] left-[50%] translate-x-[-50%]" src={crown} alt="crown"/>}
                            </div>
                        )
                    } else {
                        return <></>
                    }
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
            <button id="myBtn" onClick={() => topFunction()} className="fixed md:bottom-[20px] bottom-[10px] right-[10px] md:right-[30px] display-hidden text-white m-4 text-[2rem] z-99 rounded-full px-4 bg-gray-700 shadow-2xl">↑</button>
        </div>
    )
}

export default Rankings;