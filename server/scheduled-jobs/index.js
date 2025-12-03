import Image from "../models/Image.js";
import TestImage from "../models/TestImage.js";
import ArchivedImage from "../models/ArchivedImage.js";
import { getImagesByIdol } from "../requests/scraping.js"
import { isValidImageUrl } from "../util/index.js";
import { kpopGroups } from "../idol-data/index.js";
import probe from "probe-image-size";

import schedule from "node-schedule";

let idolsToGen = []

// node schedule
// const job = schedule.scheduleJob("0 0 1 * *", async () => {
//     console.log("image reset starting!")
// })
