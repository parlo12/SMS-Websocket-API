const DeviceCRMMapping = require("../models/DeviceCRMMapping");
const Device = require("../models/Device");
const CRM = require("../models/CRM");

exports.linkDeviceToCRM = async (req, res) => {
    const { deviceId, crmApiKey } = req.body;

    try {
        // Find CRM by API key
        const crm = await CRM.findOne({ apiKey: crmApiKey });
        if (!crm) return res.status(400).json({ message: "Invalid CRM API key" });

        // Check if device exists
        const device = await Device.findOne({ deviceId });
        if (!device) return res.status(400).json({ message: "Invalid device ID" });

        // check if device is already linked to the same CRM
        const existingMapping = await DeviceCRMMapping.findOne({ deviceId, crmId: crm._id });
        if (existingMapping) return res.status(400).json({ message: "Device already linked to the same CRM" });

        // Create mapping
        const mapping = new DeviceCRMMapping({ deviceId, crmId: crm._id });
        await mapping.save();

        return res.json({ success: true, message: "Device linked to CRM" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
