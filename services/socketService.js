const jwt = require("jsonwebtoken");
const Device = require("../models/Device");
const CRM = require("../models/CRM");
const DeviceCRMMapping = require("../models/DeviceCRMMapping");
const Message = require("../models/Message");
const { JWT_SECRET } = require("../config");
const {Mongoose, Types} = require("mongoose");

const deviceConnections = {}; // { deviceId: socketId }
const crmConnections = {};    // { crmId: socketId }

module.exports = (io) => {

    io.use(async (socket, next) => {
        try {
            const { apiKey, deviceId, token } = socket.handshake.query;

            if (apiKey) {
                // Authenticate CRM using API key
                const crm = await CRM.findOne({ apiKey });
                if (!crm) return next(new Error("Invalid API key"));

                // Save CRM identity in socket
                socket.crmId = crm._id.toString();
                crmConnections[crm._id.toString()] = socket.id;
                console.log(`CRM connected: ${crm._id}`);
            } else if (deviceId) {
                // Authenticate Device using deviceId
                const device = await Device.findOne({ deviceId });
                if (!device) return next(new Error("Invalid device ID"));

                // Optionally validate token (if using JWT)
                if (token) {
                    jwt.verify(token, process.env.JWT_SECRET, (err) => {
                        if (err) return next(new Error("Invalid token"));
                    });
                }

                // Update device connection status
                await Device.findOneAndUpdate(
                    { deviceId },
                    { connected: true, socketId: socket.id }
                );

                // Save Device identity in socket
                socket.deviceId = deviceId;
                deviceConnections[deviceId] = socket.id;
                console.log(`Device connected: ${deviceId}`);
            } else {
                return next(new Error("Missing authentication credentials"));
            }

            next(); // Allow the connection
        } catch (error) {
            console.error("Authentication error:", error.message);
            return next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        console.log("New connection:", socket.id);

        // Incoming SMS from Device → CRM
        socket.on("incomingSMS", async (msg) => {
            console.log("Incoming SMS:", msg);
            const { deviceId, sender, content } = msg;

            try {
                // Find mapped CRMs for the device
                const mappings = await DeviceCRMMapping.find({ deviceId }).populate("crmId");

                for (const mapping of mappings) {
                    console.log(`Mapping found: ${mapping}`);
                    const crmSocketId = crmConnections[mapping.crmId._id];

                    // Store message in database
                    const newMessage = new Message({
                        deviceId,
                        crmId: mapping.crmId._id,
                        sender,
                        receiver: "CRM",
                        content,
                        status: "PENDING",
                    });

                    try {
                        const savedMessage = await newMessage.save();

                        if (!savedMessage._id) {
                            console.error("Message saved but missing _id:", savedMessage);
                            continue;
                        }

                        const messageId = savedMessage._id.toString();

                        console.log(`Message saved successfully: ${messageId}`);

                        // Send message to CRM
                        if (crmSocketId) {
                            io.to(crmSocketId).emit("sms", {
                                deviceId,
                                messageId: messageId,
                                sender,
                                content,
                            });

                            savedMessage.status = "SENT";
                            await savedMessage.save();
                            console.log(`Incoming SMS sent to CRM ${mapping.crmId._id}`);
                        }
                    } catch (saveError) {
                        console.error("Error saving message:", saveError);
                    }
                }
            } catch (error) {
                console.error("Error handling incoming SMS:", error.message);
            }
        });

        // Outgoing SMS from CRM → Device
        socket.on("outgoingSMS", async (msg) => {
            const { apiKey, deviceId, receiver, content } = msg;

            try {
                // Check if device is connected
                const deviceSocketId = deviceConnections[deviceId];
                if (!deviceSocketId) {
                    console.log("Device not connected");
                    return socket.emit("error", {message: "Device not connected"});
                }

                // Store message as PENDING in database
                const newMessage = new Message({
                    deviceId,
                    crmId: new Types.ObjectId(socket.crmId),
                    sender: "CRM",
                    receiver,
                    content,
                    status: "PENDING",
                });

                await newMessage.save();

                // Forward message to the device
                io.to(deviceSocketId).emit("sendSMS", { messageId: newMessage._id.toString(), receiver, content });
                console.log(`Outgoing SMS sent to Device ${deviceId}`);
            } catch (error) {
                console.error("Error handling outgoing SMS:", error.message);
            }
        });

        // Delivery status update
        socket.on("deliveryStatus", async (statusUpdate) => {
            const { messageId, status } = statusUpdate;

            try {
                // Update message status
                const updatedMessage = await Message.findOneAndUpdate(
                    { _id: new Types.ObjectId(messageId) },
                    { status, updatedAt: Date.now() },
                    { new: true }
                );

                if (!updatedMessage) return;

                // Notify CRM
                const crmSocketId = crmConnections[updatedMessage.crmId];
                if (crmSocketId) {
                    io.to(crmSocketId).emit("deliveryStatus", {
                        messageId: updatedMessage._id,
                        status: updatedMessage.status,
                        updatedAt: updatedMessage.updatedAt,
                    });
                    console.log(`Delivery status updated for message ${messageId}`);
                }
            } catch (error) {
                console.error("Error updating delivery status:", error.message);
            }
        });

        // get pending messages
        socket.on("getPendingMessages", async (msg) => {
            // const {deviceId} = msg;
            const deviceId = socket.deviceId;

            try {
                const messages = await Message.find({deviceId, sender:"CRM",  status: "PENDING"}).sort({createdAt: 1});
                io.to(socket.id).emit("pendingMessages", messages);
            } catch (error) {
                console.error("Error getting pending messages:", error.message);
            }
        });

        // Handle disconnect
        socket.on("disconnect", async () => {
            // Remove device or CRM connections
            for (const [deviceId, socketId] of Object.entries(deviceConnections)) {
                if (socketId === socket.id) {
                    await Device.findOneAndUpdate(
                        { deviceId: socket.deviceId },
                        { connected: false, socketId: null }
                    );
                    delete deviceConnections[deviceId];
                    console.log(`Device ${deviceId} disconnected.`);
                }
            }

            for (const [crmId, socketId] of Object.entries(crmConnections)) {
                if (socketId === socket.id) {
                    delete crmConnections[crmId];
                    console.log(`CRM ${crmId} disconnected.`);
                }
            }
        });
    });
};
