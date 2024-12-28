const CRM = require("../models/CRM");
const crypto = require("crypto");

exports.registerCRM = async (req, res) => {
    const { crmName, callbackUrl, crmUid } = req.body;

    try {
        // validate the request
        if (!crmName || !callbackUrl || !crmUid) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // look for an existing CRM with the same crmUid
        const existingCRM = await CRM.findOne({ crmUid });
        if (existingCRM) {
            return res.status(400).json({ error: "CRM already exists" });
        }
        const apiKey = crypto.randomBytes(16).toString("hex");
        const crm = new CRM({ crmName, callbackUrl, apiKey, crmUid });
        await crm.save();

        return res.json({ success: true, apiKey });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
