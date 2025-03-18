const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/loginPassword", authController.loginPassword);
router.post("/sendOtp", authController.sendOtp);
router.post("/loginOtp", authController.loginOtp);

module.exports = router;
