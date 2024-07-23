import mongoose from "mongoose";

const ArchivedImageSchema = mongoose.Schema(
    {
        originUrl: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        }, 
        width: {
            type: Number
        },
        height: {
            type: Number
        },
        idolName: {
            type: String,
            required: true,
        },
        groupName: {
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

const ArchivedImage = mongoose.model("ArchivedImage", ArchivedImageSchema);
export default ArchivedImage;