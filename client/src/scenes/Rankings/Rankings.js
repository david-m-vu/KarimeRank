import "./Rankings.css"
import { getAllImages, generateImagesByIdol } from "../../requests/images.js"
import { useState, useEffect } from "react";

const Rankings = (props) => {
    const [images, setImages] = useState([]);
    const [resultMsg, setResultMsg] = useState("");
    const [idolNameInput, setIdolNameInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
        const allImages = await getAllImages();
        const totalWinsLosses = allImages.reduce(( accumulator, current) => {
            return accumulator + current.numWins + current.numLosses;
        }, 0)
        props.setTotalVotes(totalWinsLosses / 2);

        const allImagesSorted = allImages.sort((a, b) => {
            return b.score - a.score;
        })
        setImages(allImagesSorted);
    }

    const handleIdolNameInputChange = (e) => {
        setIdolNameInput(e.target.value)
    }

    const handleSearch = async (e) => {
        if (idolNameInput !== "" && (e.keyCode === 13)) {
            setIsLoading(true);
            const allImagesJSON = await generateImagesByIdol(idolNameInput);
            console.log(allImagesJSON);
            setResultMsg(`${allImagesJSON.imagesAdded} images added`)
            setIsLoading(false);
            setIdolNameInput("");
            setTimeout(() => {
                setResultMsg("");
            }, 3000)
        }
    }

    return (
        <div className="Rankings relative">
            <div className="flex justify-center mb-5">
                <input className="md:w-1/5 text-white bg-black-700 bg-opacity-50 rounded-md text-center p-[0.5rem] text-[1.5rem]" onKeyDown={handleSearch} placeholder="Add Idol" value={idolNameInput} onChange={handleIdolNameInputChange} type="text" name="search"></input>
                <div className="resultMsg absolute text-black">{resultMsg}</div>
            </div>
            <div className="images flex flex-row flex-wrap md:gap-10 gap-6 md:p-8 justify-center p-4">
                {images.map((image, index) => {
                    return (
                        <div key={image._id} className="rounded-xl p-2 bg-white shadow-2xl">
                            <div className="flex flex-row justify-center">
                                <img className=" border-4 border-black md:h-[30rem] h-[20rem] rounded-xl" src={image.imageUrl} alt={image.imageName} />
                            </div>
                            <div className="flex flex-row items-center gap-8 flex-wrap">
                                <div className=" md:text-[6rem] text-[4rem] rankNumber">{index + 1}.</div>
                                <div className="flex flex-col justify-center flex-1 items-center">
                                    <div className="text-center text-[2rem] md:text-[2rem]">W: {image.numWins} L: {image.numLosses}</div>
                                    <div className="text-center text-[1rem] md:text-[2rem]">
                                        Score: {image.score}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
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