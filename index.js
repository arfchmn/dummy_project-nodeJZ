import express from "express";
import corsMiddleware from "./middleware/corsConfig.js";
import limiter from "./middleware/limiterConfig.js";
import dotenv from "dotenv";
import transactionRoute from "./routes/transactionRouting.js"
import membershipRoute from "./routes/membershipRouting.js"
import informationRoute from "./routes/informationRouting.js"
import path from "path"

const app = express();
dotenv.config();
app.set('trust proxy',true)
app.use([
    corsMiddleware,
    limiter,
    express.json({limit: "5mb"})
])
app.use('',informationRoute,membershipRoute,transactionRoute)
const __dirname = path.resolve();
app.use("/member_photo", express.static(path.join(__dirname, "member_photo")))

const PORT = process.env.PORT || 4220;
app.listen(
    PORT, () => console.log('Server running on port: ',{PORT}),
);