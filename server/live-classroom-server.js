/**
 * Real-time live classroom server (Socket.io).
 * Run: node server/live-classroom-server.js
 */
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const PORT = Number(process.env.LIVE_CLASSROOM_SOCKET_PORT || 3001);
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const prismaPath = path.resolve(__dirname, "../frontend/node_modules/.prisma/client");
const { PrismaClient } = require(path.resolve(__dirname, "../frontend/node_modules/@prisma/client"));
const prisma = new PrismaClient();

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: [CORS_ORIGIN, "http://localhost:3000"], credentials: true },
});

const rooms = new Map();

function getRoom(sessionId) {
  if (!rooms.has(sessionId)) {
    rooms.set(sessionId, {
      participants: new Map(),
      whiteboard: [],
      activePoll: null,
    });
  }
  return rooms.get(sessionId);
}

io.on("connection", (socket) => {
  socket.on("join-room", async (payload) => {
    const { sessionId, userId, name, role } = payload || {};
    if (!sessionId || !userId) return;

    socket.join(sessionId);
    const room = getRoom(sessionId);
    room.participants.set(socket.id, { userId, name, role, handRaised: false });

    io.to(sessionId).emit("participants-updated", {
      participants: Array.from(room.participants.values()),
    });

    const history = await prisma.liveClassChatMessage.findMany({
      where: { liveClassId: sessionId },
      orderBy: { createdAt: "asc" },
      take: 80,
    });
    socket.emit("chat-history", {
      messages: history.map((m) => ({
        id: m.id,
        senderName: m.senderName,
        senderRole: m.senderRole,
        message: m.message,
        createdAt: m.createdAt.toISOString(),
      })),
    });

    if (room.activePoll) {
      socket.emit("poll-active", room.activePoll);
    }
    socket.emit("whiteboard-state", { strokes: room.whiteboard });
  });

  socket.on("chat-message", async (payload) => {
    const { sessionId, userId, name, role, message } = payload || {};
    if (!sessionId || !message?.trim()) return;

    const dbRole = role === "lecturer" ? "LECTURER" : role === "admin" ? "ADMIN" : "STUDENT";

    const saved = await prisma.liveClassChatMessage.create({
      data: {
        liveClassId: sessionId,
        userId,
        senderName: name || "User",
        senderRole: dbRole,
        message: message.trim().slice(0, 2000),
      },
    });

    io.to(sessionId).emit("chat-message", {
      id: saved.id,
      senderName: saved.senderName,
      senderRole: saved.senderRole,
      message: saved.message,
      createdAt: saved.createdAt.toISOString(),
    });
  });

  socket.on("raise-hand", async (payload) => {
    const { sessionId, studentId, name } = payload || {};
    if (!sessionId || !studentId) return;

    await prisma.liveClassHandRaise.upsert({
      where: { liveClassId_studentId: { liveClassId: sessionId, studentId } },
      create: { liveClassId: sessionId, studentId, studentName: name || "Student" },
      update: { isActive: true, studentName: name || "Student" },
    });

    const room = getRoom(sessionId);
    const participant = [...room.participants.values()].find((p) => p.userId === studentId);
    if (participant) participant.handRaised = true;

    io.to(sessionId).emit("hand-raised", { studentId, name });
    io.to(sessionId).emit("participants-updated", {
      participants: Array.from(room.participants.values()),
    });
  });

  socket.on("lower-hand", async (payload) => {
    const { sessionId, studentId } = payload || {};
    if (!sessionId || !studentId) return;

    await prisma.liveClassHandRaise.updateMany({
      where: { liveClassId: sessionId, studentId },
      data: { isActive: false },
    });

    const room = getRoom(sessionId);
    const participant = [...room.participants.values()].find((p) => p.userId === studentId);
    if (participant) participant.handRaised = false;

    io.to(sessionId).emit("hand-lowered", { studentId });
    io.to(sessionId).emit("participants-updated", {
      participants: Array.from(room.participants.values()),
    });
  });

  socket.on("poll-create", async (payload) => {
    const { sessionId, question, options } = payload || {};
    if (!sessionId || !question || !options?.length) return;

    const poll = await prisma.liveClassPoll.create({
      data: {
        liveClassId: sessionId,
        question: question.trim(),
        options: JSON.stringify(options),
        isActive: true,
      },
    });

    const pollData = {
      id: poll.id,
      question: poll.question,
      options,
      isActive: true,
      votes: options.map(() => 0),
    };

    getRoom(sessionId).activePoll = pollData;
    io.to(sessionId).emit("poll-active", pollData);
  });

  socket.on("poll-vote", async (payload) => {
    const { sessionId, pollId, studentId, optionIndex } = payload || {};
    if (!sessionId || !pollId || studentId == null || optionIndex == null) return;

    await prisma.liveClassPollVote.upsert({
      where: { pollId_studentId: { pollId, studentId } },
      create: { pollId, studentId, optionIndex },
      update: { optionIndex },
    });

    const votes = await prisma.liveClassPollVote.groupBy({
      by: ["optionIndex"],
      where: { pollId },
      _count: { optionIndex: true },
    });

    const room = getRoom(sessionId);
    if (room.activePoll?.id === pollId) {
      const counts = room.activePoll.options.map((_, i) => {
        const found = votes.find((v) => v.optionIndex === i);
        return found?._count.optionIndex ?? 0;
      });
      room.activePoll.votes = counts;
      io.to(sessionId).emit("poll-results", { pollId, votes: counts });
    }
  });

  socket.on("whiteboard-draw", (payload) => {
    const { sessionId, stroke } = payload || {};
    if (!sessionId || !stroke) return;
    const room = getRoom(sessionId);
    room.whiteboard.push(stroke);
    if (room.whiteboard.length > 500) room.whiteboard.shift();
    socket.to(sessionId).emit("whiteboard-draw", { stroke });
  });

  socket.on("whiteboard-clear", (payload) => {
    const { sessionId } = payload || {};
    if (!sessionId) return;
    getRoom(sessionId).whiteboard = [];
    io.to(sessionId).emit("whiteboard-clear");
  });

  socket.on("disconnecting", () => {
    for (const sessionId of socket.rooms) {
      if (sessionId === socket.id) continue;
      const room = rooms.get(sessionId);
      if (!room) continue;
      room.participants.delete(socket.id);
      io.to(sessionId).emit("participants-updated", {
        participants: Array.from(room.participants.values()),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Live classroom Socket.io server on http://localhost:${PORT}`);
});
