const mongoose = require("mongoose");

const DeviceCRMMappingSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    crmId: { type: mongoose.Schema.Types.ObjectId, ref: "CRM", required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeviceCRMMapping", DeviceCRMMappingSchema);
