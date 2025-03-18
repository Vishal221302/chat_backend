const dotenv = require('dotenv');
const mysql = require('mysql');
dotenv.config();
module.exports = mysql.createConnection({
host: process.env.DB_HOST,
user: process.env.DB_USERNAME,
password: process.env.DB_PASSWORD, 
database: process.env.DB_DATABASE 
});