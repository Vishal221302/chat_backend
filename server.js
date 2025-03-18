const app = require("./src/app");
const http = require("http");
const socket = require("./Config/socket"); // Import Socket.IO
const config = require("./Config/db");
const cors = require("cors");


const server = http.createServer(app);
const allowedOrigin = process.env.APP_URL || "http://localhost:8000";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

config.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Database connected successfully");
  // Initialize Socket.IO after the server is created
  socket.init(server);

  // Listen on the server port
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(
      `App is running on ${process.env.APP_URL || `http://localhost:${PORT}`}`
    );
  });
});

