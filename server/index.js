import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import imageRoutes from "./routes/images.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN, // Access-Control-Allow-Origin - to allow frontend if it lives on different origin
  credentials: true // Access-Control-Allow-Credentials : true - to allow cross origin cookie sends
}));

/* ROUTES */
app.get("/", (req, res) => {
    res.send("running");
})

app.use("/images", imageRoutes)
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 6001;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})
