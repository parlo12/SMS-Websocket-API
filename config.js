require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
    DB_URI: process.env.DB_URI || "mongodb://localhost:27017/default-db",
};
