import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "agora-token";
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder } = pkg;
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());

// Serve viewer.html if mode=viewer is present
app.use((req, res, next) => {
    if (req.query.mode === 'viewer' && req.path === '/') {
        return res.sendFile(join(__dirname, "public", "viewer.html"));
    }
    next();
});

app.use(express.json());

// Redirect /blog.html to /blog and /index.html to /
app.get("/blog.html", (req, res) => {
  res.redirect(301, "/blog");
});

app.get("/index.html", (req, res) => {
  res.redirect(301, "/");
});

app.get("/blog/index.html", (req, res) => {
  res.redirect(301, "/blog");
});

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use((req, res, next) => {
  if (req.path.endsWith(".md")) {
    res.set("Content-Type", "text/markdown; charset=utf-8");
  } else if (req.path.endsWith(".json")) {
    res.set("Content-Type", "application/json; charset=utf-8");
  }
  next();
});

// API endpoint to get YouTube API key from .env
app.get("/api/get-api-key", (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY || "";

  // Don't expose the full key in logs for security
  if (apiKey) {
    console.log("API key provided from .env file");
  } else {
    console.log("No API key found in .env file");
  }

  res.json({ apiKey });
});

// ========================================
// 🔒 Room Participant Limit System
// ========================================
const MAX_PARTICIPANTS_PER_ROOM = 6; // 방당 최대 6명
const roomParticipants = new Map(); // { channelName: Set([uid1, uid2, ...]) }

// 방 참여자 수 확인
function getRoomParticipantCount(channelName) {
  const participants = roomParticipants.get(channelName);
  return participants ? participants.size : 0;
}

// 참여자 추가
function addParticipant(channelName, uid) {
  if (!roomParticipants.has(channelName)) {
    roomParticipants.set(channelName, new Set());
  }
  roomParticipants.get(channelName).add(uid);
  console.log(`✅ [${channelName}] Added UID ${uid}. Total: ${roomParticipants.get(channelName).size}`);
}

// 참여자 제거
function removeParticipant(channelName, uid) {
  const participants = roomParticipants.get(channelName);
  if (participants) {
    participants.delete(uid);
    console.log(`❌ [${channelName}] Removed UID ${uid}. Total: ${participants.size}`);
    
    // 방 비었으면 삭제
    if (participants.size === 0) {
      roomParticipants.delete(channelName);
      console.log(`🗑️ [${channelName}] Room deleted (empty)`);
    }
  }
}

// API: 참여자 퇴장 알림
app.post("/api/participant-left", express.json(), (req, res) => {
  const { channelName, uid } = req.body;
  
  if (!channelName || !uid) {
    return res.status(400).json({ error: "channelName and uid required" });
  }
  
  removeParticipant(channelName, uid);
  res.json({ success: true });
});

// API: 현재 방 상태 조회
app.get("/api/room-status", (req, res) => {
  const { channelName } = req.query;
  
  if (!channelName) {
    return res.status(400).json({ error: "channelName required" });
  }
  
  const count = getRoomParticipantCount(channelName);
  const isFull = count >= MAX_PARTICIPANTS_PER_ROOM;
  
  res.json({
    channelName,
    currentParticipants: count,
    maxParticipants: MAX_PARTICIPANTS_PER_ROOM,
    isFull,
    canJoin: !isFull
  });
});

// API endpoint to generate Agora token
app.get("/api/get-agora-token", (req, res) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channelName = req.query.channelName;
  const uid = Number(req.query.uid);
  const role =
    req.query.role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const expireTime = 3600; // 1 hour
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  if (isNaN(uid) || uid === 0) {
    return res.status(400).json({ error: "uid must be a non-zero number" });
  }

  if (!appId || !appCertificate) {
    return res.status(500).json({ error: "Agora credentials not configured" });
  }

  if (!channelName) {
    return res.status(400).json({ error: "channelName is required" });
  }

  // 🔒 참여자 수 제한 체크
  const currentCount = getRoomParticipantCount(channelName);
  const participants = roomParticipants.get(channelName);
  const isAlreadyInRoom = participants && participants.has(uid);
  
  // 이미 방에 있는 사용자는 재접속 허용
  if (!isAlreadyInRoom && currentCount >= MAX_PARTICIPANTS_PER_ROOM) {
    console.log(`⛔ [${channelName}] Room full! Rejected UID ${uid} (${currentCount}/${MAX_PARTICIPANTS_PER_ROOM})`);
    return res.status(403).json({ 
      error: "ROOM_FULL",
      message: `방이 가득 찼습니다! (${currentCount}/${MAX_PARTICIPANTS_PER_ROOM}명)`,
      currentParticipants: currentCount,
      maxParticipants: MAX_PARTICIPANTS_PER_ROOM
    });
  }

  // Debugging log
  console.log(`Generating token for UID: ${uid}, Channel: ${channelName}, Role: ${req.query.role} (${role})`);

  const rtcToken = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTime,
    privilegeExpireTime
  );

  const rtmToken = RtmTokenBuilder.buildToken(
    appId,
    appCertificate,
    uid.toString(),
    privilegeExpireTime
  );

  // ✅ 토큰 발급 성공 시 참여자 추가
  addParticipant(channelName, uid);

  res.json({ rtcToken, rtmToken });
});

// Serve static files from 'public' directory with .html extension support for clean URLs
app.use(express.static(join(__dirname, "public"), { extensions: ["html"] }));

// Handle non-existent static assets
app.get(["/posts/*", "/js/*", "/css/*"], (req, res, next) => {
  // This middleware will only be reached if express.static fails to find the file.
  // Thus, we can assume the file does not exist.

  if (req.path.startsWith("/posts/")) {
    // Invalid post URL, redirect to the blog index
    return res.redirect(301, "/");
  }

  // For other static asset directories, it's a 404
  return res.status(404).sendFile(join(__dirname, "public", "404.html"));
});

// Fallback to index.html for SPA routing (client-side routing)
// This should not have a file extension.
app.get("*", (req, res) => {
  // If the path has an extension, it's a 404 because it should have been caught by express.static
  if (req.path.includes(".")) {
    return res.status(404).sendFile(join(__dirname, "public", "404.html"));
  }
  // Otherwise, serve the main app
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StudyWithMe server running at http://studywithme.co:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  if (process.env.YOUTUBE_API_KEY) {
    console.log("✅ YouTube API key loaded from .env");
  } else {
    console.log("⚠️  No YouTube API key in .env file");
  }
});
