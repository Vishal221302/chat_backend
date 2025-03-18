const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const authRoutes = require("../src/routes/authRoutes");
const cors = require("cors");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// List of allowed origins (local development and ngrok)
const allowedOrigins = [
  'https://chatapp-kohl-tau.vercel.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
};

// Other route imports remain the same
app.use(cors(corsOptions));
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
// Other routes usage remain the same

module.exports = app;
