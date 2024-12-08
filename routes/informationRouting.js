import express  from "express";
import{
    banner,
    services
}from "../controller/informationController.js";
import verifyToken from "../auth/auth.js"

const router = express.Router();

router.get('/banner',banner);
router.get('/services',verifyToken,services)
export default router;