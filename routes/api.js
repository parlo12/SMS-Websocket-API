const express = require("express");
const router = express.Router();
const { registerDevice } = require("../controllers/deviceController");
const { registerCRM } = require("../controllers/crmController");

router.post("/registerDevice", registerDevice);
router.post("/registerCRM", registerCRM);

module.exports = router;
