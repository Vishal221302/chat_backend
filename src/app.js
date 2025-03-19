const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const authRoutes = require("../src/routes/authRoutes");
const cors = require("cors");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// List of allowed origins (local development and ngrok)
// const allowedOrigins = [
//   'https://chat-gamma-beryl.vercel.app',
// ];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// };

// Other route imports remain the same
// app.use(cors(corsOptions));


// ✅ CORS Configuration
const allowedOrigins = [
  "https://chat-app-taupe-seven.vercel.app", // Frontend hosted on Vercel
  "http://localhost:3000" // Allow localhost for development
];

app.use(cors({
  origin: allowedOrigins, // Allow only the specified origins
  credentials: true, // Allow cookies and authentication headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"] // Allowed headers
}));


app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
// Other routes usage remain the same

module.exports = app;
