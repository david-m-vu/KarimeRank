import "./Rankings.css"
import { getAllImages, generateImagesByIdol } from "../../requests/images.js"
import { useState, useEffect } from "react";

const Rankings = () => {
    const [images, setImages] = useState([]);
    const [errMsg, setErrMsg] = useState("");
    const [idolNameInput, setIdolNameInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchImages();
    }, [])

    const fetchImages = async () => {
        const allImages = await getAllImages();

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
            await generateImagesByIdol(idolNameInput);
            setIsLoading(false);
            setIdolNameInput("");
        }
    }

    return (
        <div className="Rankings relative">
            <div className="flex justify-center mb-5">
                <input className="md:w-1/5 text-white bg-black-700 bg-opacity-50 rounded-md text-center p-[0.5rem] text-[1.5rem]" onKeyDown={handleSearch} placeholder="Add Idol" value={idolNameInput} onChange={handleIdolNameInputChange} type="text" name="search"></input>
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
            <div className="absolute m-4 text-[4rem] z-99 border-4 border-black rounded-md p-2">^</div>
        </div>
    )
}

export default Rankings;