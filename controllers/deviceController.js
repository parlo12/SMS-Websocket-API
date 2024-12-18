const jwt = require("jsonwebtoken");
const Device = require("../models/Device");
const { JWT_SECRET } = require("../config");

exports.registerDevice = async (req, res) => {
    const { deviceId, phoneNumber } = req.body;

    try {
        let device = await Device.findOne({ deviceId });
        if (!device) {
            device = new Device({ deviceId, phoneNumber });
            await device.save();
        }

        const token = jwt.sign({ deviceId }, JWT_SECRET, { expiresIn: "90d" });
        return res.json({ success: true, token });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
