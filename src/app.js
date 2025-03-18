const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const authRoutes = require("../src/routes/authRoutes");
const cors = require("cors");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// List of allowed origins (local development and ngrok)
const allowedOrigins = [
  "https://chatapp-kohl-tau.vercel.app",
  "http://localhost:3000", // Allow localhost for testing
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Incoming Origin:", origin); // Debugging log
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
// Other routes usage remain the same

module.exports = app;
