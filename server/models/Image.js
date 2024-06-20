import mongoose from "mongoose";

const ImageSchema = mongoose.Schema(
    {
        originUrl: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        }, 
        idolName: {
            type: String,
            required: true,
        },
        title: {
            type: String, 
            requiredd: true,
        },
        imageName: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
            default: 1500
        },
        numWins: {
            type: Number,
            default: 0
        },
        numLosses: {
            type: Number,
            default: 0
        }
    }, {timestamps: true}
)

const Image = mongoose.model("Image", ImageSchema);
export default Image;