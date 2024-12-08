import express  from "express";
import{
    balance,
    topup,
    transaction,
    transactHistory

}from "../controller/transcationController.js";
import verifyToken from "../auth/auth.js"

const router = express.Router();

router.get('/balance',verifyToken, balance);
router.get('/transaction/history',verifyToken, transactHistory);
router.post('/topup',verifyToken,topup);
router.post('/transaction',verifyToken ,transaction);

export default router;