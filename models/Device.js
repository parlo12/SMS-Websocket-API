const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    connected: { type: Boolean, default: false },
    socketId: { type: String, default: null },
});

module.exports = mongoose.model("Device", DeviceSchema);
