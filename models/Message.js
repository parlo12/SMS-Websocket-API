const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    crmId: { type: mongoose.Schema.Types.ObjectId, ref: "CRM", required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["SENT", "DELIVERED", "FAILED", "PENDING"], default: "PENDING" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);
