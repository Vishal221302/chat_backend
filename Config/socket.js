let io;
let connectedUsers = {};

function init(server) {
  io = require("socket.io")(server, {
    cors: {
      origin: "https://chat-app-taupe-seven.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected: ", socket.id);
    const userId = socket.handshake.query.userId;
    connectedUsers[userId] = true; 
    io.emit("userStatus", { userId, status: "online" });
    socket.on("sendMessage", (message) => {
      io.emit("receiveMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected: ", socket.id);
      delete connectedUsers[userId]; 
      io.emit("userStatus", { userId, status: "offline" });
    });
  });
}

function getIo() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { init, getIo };
