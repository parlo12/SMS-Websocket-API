const Message = require("../models/Message");
const Device = require("../models/Device");
const {Types} = require("mongoose");

exports.getMessages = async (req, res) => {
    const { deviceId, crmId, status } = req.query;

    try {
        const filter = {};
        if (deviceId) filter.deviceId = deviceId;
        if (crmId) filter.crmId = crmId;
        if (status) filter.status = status;

        const messages = await Message.find(filter).sort({ createdAt: -1 });

        return res.json({ success: true, messages });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.sendOutgoingMessage = async (req, res) => {
    const { apiKey, deviceId, receiver, content } = req.body;

    // Retrieve `io` and `deviceConnections` from `app`
    const io = req.app.get("io");

    try {
        // Check if device is connected
        const deviceMapping = await Device.findOne({ deviceId });
        if (!deviceMapping) {
            return res.status(400).json({ message: "Device not connected" });
        }
        const deviceSocketId = deviceMapping.socketId;

        // Store message as PENDING in database
        const newMessage = new Message({
            deviceId,
            crmId: new Types.ObjectId(req.crmId),
            sender: "CRM",
            receiver,
            content,
            status: "PENDING",
        });

        await newMessage.save();

        // Emit event to device
        io.to(deviceSocketId).emit("sendSMS", {
            messageId: newMessage._id.toString(),
            receiver,
            content,
        });

        console.log(`Outgoing SMS sent to Device ${deviceId}`);

        return res.status(200).json({
            message: "SMS request sent to device",
            messageId: newMessage._id.toString(),
        });
    } catch (error) {
        console.error("Error handling outgoing SMS:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}
