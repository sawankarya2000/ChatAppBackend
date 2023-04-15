const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join-room", (data) => {
    const { username, room } = data;
    emailToSocketIdMap.set(username, socket.id);
    socketIdToEmailMap.set(socket.id, username);
    socket.join(room);
    socket.to(room).emit("user:joined", { username, id: socket.id });
    console.log(
      `User with ID: ${socket.id} and name: ${username} joined room: ${room}`
    );
  });

  socket.on("user:call", ({ to, offer }) => {
    socket.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    socket.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    socket.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    socket.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("send-message", (data) => {
    // console.log(data.message);
    socket.to(data.room).emit("receive-message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log("Server Started");
});
