const express = require("express");
const router = express.Router();
const { getMessages } = require("../controllers/messageController");
const { sendOutgoingMessage } = require("../controllers/messageController");

router.get("/getMessages", getMessages);
router.post("/sendOutgoingMessage", sendOutgoingMessage);

module.exports = router;
