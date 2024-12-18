const CRM = require("../models/CRM");
const crypto = require("crypto");

exports.registerCRM = async (req, res) => {
    const { crmName, callbackUrl } = req.body;

    try {
        const apiKey = crypto.randomBytes(16).toString("hex");
        const crm = new CRM({ crmName, callbackUrl, apiKey });
        await crm.save();

        return res.json({ success: true, apiKey });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
