const express = require("express");
const router = express.Router();
const { getMessages } = require("../controllers/messageController");

router.get("/getMessages", getMessages);

module.exports = router;
