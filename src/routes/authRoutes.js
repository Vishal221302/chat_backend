const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/loginPassword", authController.loginPassword);
 router.post("/logout", authController.logout);
 router.post("/sendOtp", authController.sendOtp);
router.post("/loginOtp", authController.loginOtp);
router.post("/verifyOtp", authController.verifyOtp);
router.post("/resetpassword", authController.resetPassword);
router.get("/getAlluser", authController.allusers);
router.get("/userInfo", verifyToken,authController.getUserInfo);
router.put("/updateprofile", verifyToken, authController.updateProfile)

router.post("/sendMessage",verifyToken, authController.sendmessage);
router.post("/seenmessage/:senderId", verifyToken, authController.markMessageSeen);
 router.get("/unseencount/:userId", verifyToken, authController.countUnseenMessages);
router.get("/messages/:otherUserId", verifyToken, authController.getAllMessagesForUser);
 router.get("/getnotification", verifyToken, authController.getNotifications);
 router.put('/seennotification/:notification_id', verifyToken,authController.markNotificationAsSeen)

module.exports = router;
