const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const { PORT, DB_URI } = require("./config");
const apiRoutes = require("./routes/api");
const mappingRoutes = require("./routes/mapping");
const messageRoutes = require("./routes/messages");
const socketService = require("./services/socketService");

const app = express();
app.use(bodyParser.json());
app.use("/api", apiRoutes);
app.use("/mapping", mappingRoutes);
app.use("/messages", messageRoutes);

const server = http.createServer(app);
const io = socketIo(server);

mongoose.connect(DB_URI).then(() => console.log("DB Connected"));

socketService(io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
