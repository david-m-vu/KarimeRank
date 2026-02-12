import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import imageRoutes from "./routes/images.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

/* ROUTES */
app.get("/", (req, res) => {
    res.send("running");
})

app.use("/images", imageRoutes)

const PORT = process.env.PORT || 6001;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})
