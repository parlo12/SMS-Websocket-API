const express = require("express");
const router = express.Router();
const { linkDeviceToCRM } = require("../controllers/mappingController");

router.post("/linkDeviceToCRM", linkDeviceToCRM);

module.exports = router;
