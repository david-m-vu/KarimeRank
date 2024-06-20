import "./Main.css"
import { getAllImages } from "../../requests/images.js"

import { useState, useEffect } from "react";

const Main = () => {
    const [images, setImages] = useState([]);

    useEffect(() => {
        const fetchImages = async () => {
            setImages(await getAllImages());
        }
        fetchImages();
    }, [])

    return (
        <div className="Main">
            <div className=" flex flex-row justify-center">
                <h1 className="border-4 p-2 border-black">
                    Which Picture do you like more?
                </h1>
            </div>

            <div className="flex flex-row flex-wrap">
                {images.map((image) => {
                    return <img className="w-1/5" src={image.imageUrl} alt={image.imageName}/>
                })}
            </div>
            <button onClick={() => console.log(images)}>button</button>
        </div>
    )
}

export default Main;