const Message = require("../models/Message");

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
