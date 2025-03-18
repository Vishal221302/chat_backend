const app = require("./src/app");
const http = require("http");
const socket = require("./Config/socket"); // Import Socket.IO
const config = require("./Config/db");

const server = http.createServer(app);

config.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Database connected successfully");
  // Initialize Socket.IO after the server is created
  socket.init(server);

  // Listen on the server port
  server.listen(process.env.PORT || 8000, () => {
    console.log("App is running on http://localhost:8000");
  });
});

