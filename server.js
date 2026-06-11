/**
 * Custom HTTP server: Next.js + Socket.IO for real-time portal updates.
 */
const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const next = require(path.join(__dirname, "frontend", "node_modules", "next"));
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const frontendDir = path.join(__dirname, "frontend");
const app = next({ dev, dir: frontendDir });
const handle = app.getRequestHandler();

const SOCKET_PATH = "/api/socket/io";

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: SOCKET_PATH,
    addTrailingSlash: false,
    cors: {
      origin: process.env.APP_BASE_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  global.__transitSocketIO = io;

  io.on("connection", (socket) => {
    socket.on("join", (rooms) => {
      if (!Array.isArray(rooms)) return;
      for (const room of rooms) {
        if (typeof room === "string" && room.length > 0) {
          socket.join(room);
        }
      }
    });

    socket.on("leave", (rooms) => {
      if (!Array.isArray(rooms)) return;
      for (const room of rooms) {
        if (typeof room === "string" && room.length > 0) {
          socket.leave(room);
        }
      }
    });

    socket.on("typing", (payload) => {
      if (!payload?.room) return;
      socket.to(payload.room).emit("typing", {
        room: payload.room,
        userId: payload.userId,
        name: payload.name,
        isTyping: Boolean(payload.isTyping),
      });
    });
  });

  const port = parseInt(process.env.PORT || "3000", 10);
  httpServer.listen(port, () => {
    console.log(`> Transit app ready on http://localhost:${port} (Socket.IO enabled)`);
  });
});
