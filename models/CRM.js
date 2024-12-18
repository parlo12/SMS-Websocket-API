const mongoose = require("mongoose");

const CRMSchema = new mongoose.Schema({
    crmName: { type: String, required: true },
    apiKey: { type: String, required: true, unique: true },
    callbackUrl: { type: String, required: true },
    connected: { type: Boolean, default: false },
    socketId: { type: String, default: null },
});

module.exports = mongoose.model("CRM", CRMSchema);
