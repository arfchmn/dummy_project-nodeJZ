import express  from "express";
import{
    register,
    login,
    profile,
    updateProfile,
    updateProfileImage
}from "../controller/membershipController.js";
import verifyToken from "../auth/auth.js"
import uploadFilePhoto from "../middleware/multerConfig.js";

const router = express.Router();

router.post('/registration',register);
router.post('/login', login);
router.get('/profile',verifyToken, profile);
router.put('/profile/update',verifyToken, updateProfile);
router.put('/profile/image',verifyToken, uploadFilePhoto, updateProfileImage);



export default router;