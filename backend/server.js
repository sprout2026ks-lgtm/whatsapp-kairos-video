const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const webhookRoutes = require("./routes/webhook");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS middleware: allow requests from Angular frontend without exposing sensitive credentials
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware for parsing JSON webhook payloads from Meta
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static media files (WhatsApp video and audio lessons)
const mediaDir = path.join(__dirname, "public", "media");
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}
app.use("/media", (req, res, next) => {
  console.log(
    `[Media Request] Streaming: ${req.url} | Headers: ${
      req.headers["range"] || "full"
    } | Agent: ${req.headers["user-agent"] || "unknown"}`
  );
  next();
});
app.use(
  "/media",
  express.static(mediaDir, {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Accept-Ranges", "bytes");
    }
  })
);
// Dynamic cache-busting media fallback
app.get("/media/:filename", (req, res) => {
  const filePath = path.join(mediaDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  const mainVideo = path.join(mediaDir, "sample_lesson.mp4");
  if (fs.existsSync(mainVideo)) {
    return res.sendFile(mainVideo);
  }
  res.status(404).json({ error: "Media not found" });
});

// WhatsApp Webhook routes
app.use("/webhook", webhookRoutes);

// Health check endpoint (Requirement 11)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Server status & information endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Kairos Lite WhatsApp Cloud API Chatbot Backend",
    phoneRegistered: process.env.WHATSAPP_PHONE_NUMBER || "+49XXXXXXXXXX",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "1441499925712464",
    graphApiVersion: process.env.GRAPH_API_VERSION || "v26.0",
    webhookConfigured: "/webhook",
    timestamp: new Date().toISOString()
  });
});

// View captured candidate leads
app.get("/leads", (req, res) => {
  try {
    const leadsPath = path.join(__dirname, "data", "leads.json");
    if (fs.existsSync(leadsPath)) {
      const data = fs.readFileSync(leadsPath, "utf8");
      return res.json({
        totalLeads: JSON.parse(data).length,
        leads: JSON.parse(data)
      });
    }
    return res.json({ totalLeads: 0, leads: [] });
  } catch (err) {
    return res.status(500).json({ error: "Failed to read leads store" });
  }
});

// ==========================================
// DRM Protected Video Player & Sync Endpoints
// ==========================================
const { verifyPlayerToken, resolveSession, bindSessionDevice, createShortSession } = require("./utils/playerToken");
const googleSheetService = require("./services/googleSheetService");
const studentProgressService = require("./services/studentProgressService");
const whatsappService = require("./services/whatsappService");

// 1. Serve Protected Video Player (Supports /watch and /classroom/:sessionId)
app.get(["/watch", "/classroom", "/classroom/:sessionId"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "player.html"));
});

// 2. Video Player Session Info with Anti-Sharing Device Lock & Module Tracking
app.get("/api/video/session", async (req, res) => {
  const tokenOrId = req.query.token || req.query.session;
  const deviceSig = req.query.deviceSig || req.headers["x-device-sig"];

  if (!tokenOrId) {
    return res.status(400).json({ success: false, message: "Missing session identifier" });
  }

  // Device Lock Check: If it's a short session ID, enforce single-device binding
  if (deviceSig) {
    const bindResult = bindSessionDevice(tokenOrId, deviceSig, req.headers["user-agent"] || "");
    if (!bindResult.success && bindResult.reason === "DEVICE_MISMATCH") {
      return res.status(403).json({
        success: false,
        deviceLocked: true,
        message: "🚫 Unauthorized Device Detected.\n\nThis video lesson is locked to the original registered student's device.\n\nCourse video links are strictly non-transferable and cannot be shared or forwarded.",
        phone: bindResult.phone ? bindResult.phone.slice(-4) : "****"
      });
    }
  }

  const resolved = resolveSession(tokenOrId, deviceSig);
  if (!resolved || resolved.deviceMismatch || !resolved.payload) {
    return res.status(403).json({
      success: false,
      deviceLocked: true,
      message: "🚫 Access Denied: This link has already been opened on another device. Forwarding or sharing video links is strictly prohibited."
    });
  }

  const payload = resolved.payload;
  const modId = Math.min(6, Math.max(1, Number(payload.moduleId) || 1));

  // Verify payment status from Google Sheets
  const sheetRes = await googleSheetService.getStudentByPhone(payload.phone);
  if (sheetRes.success && sheetRes.student) {
    const pStatus = String(sheetRes.student.paymentStatus || "").trim().toLowerCase();
    const isPaid = pStatus === "yes" || pStatus === "y" || pStatus === "paid" || pStatus === "true" || pStatus === "1" || pStatus.startsWith("y");
    if (!isPaid) {
      return res.status(403).json({
        success: false,
        message: "Course fee payment is pending. Please contact admissions to unlock class access."
      });
    }
  }

  const progressData = studentProgressService.getStudentProgress(payload.phone);
  const currentProgress = progressData.moduleProgress[String(modId)] || payload.startProgress || 0;

  res.json({
    success: true,
    token: resolved.token,
    deviceSig: deviceSig,
    student: {
      name: payload.name,
      phone: payload.phone,
      course: "Business Success Class",
      moduleId: modId,
      currentModule: progressData.currentModule,
      completedModules: progressData.completedModules,
      startProgress: currentProgress
    }
  });
});

// 3. Heartbeat Video Progress Sync (Google Sheets & local progress sync)
app.post("/api/video/progress", (req, res) => {
  const { token, progressSeconds, deviceSig, moduleId } = req.body || {};
  const resolved = resolveSession(token, deviceSig);
  if (!resolved || resolved.deviceMismatch || !resolved.payload) {
    return res.status(401).json({ success: false, message: "Invalid session token" });
  }

  const payload = resolved.payload;
  const modId = Math.min(6, Math.max(1, Number(moduleId || payload.moduleId) || 1));
  const seconds = Math.floor(Number(progressSeconds) || 0);

  if (seconds >= 0) {
    studentProgressService.setModuleProgress(payload.phone, modId, seconds);
    googleSheetService.updateStudentProgress(payload.phone, seconds).catch(err => {
      console.warn("[Video Progress Sync] Error updating Google Sheets:", err.message);
    });
  }

  res.json({ success: true, savedSeconds: seconds, moduleId: modId });
});

// 3.5 Video Completion Endpoint: Auto-advance and dispatch next video link to WhatsApp
app.post("/api/video/complete", async (req, res) => {
  const { token, deviceSig, moduleId } = req.body || {};
  const resolved = resolveSession(token, deviceSig);
  if (!resolved || resolved.deviceMismatch || !resolved.payload) {
    return res.status(401).json({ success: false, message: "Invalid session token" });
  }

  const payload = resolved.payload;
  const phone = payload.phone;
  const modId = Math.min(6, Math.max(1, Number(moduleId || payload.moduleId) || 1));

  const result = studentProgressService.completeModule(phone, modId);
  const baseUrl = (process.env.SERVER_BASE_URL || "").replace(/\/$/, "");
  const rawName = payload.name || "Student";
  const studentName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  let nextClassroomUrl = null;

  if (result.isNewlyCompleted) {
    if (result.allCompleted) {
      // Course completed! Send congratulations message
      await whatsappService.sendMessageSequence(phone, [
        {
          type: "text",
          text: `🎓 *CONGRATULATIONS ${studentName.toUpperCase()}!* 🏆\n\n` +
                `You have successfully completed all 6 modules of the *Business Success Class*!\n\n` +
                `🌟 Outstanding achievement! We wish you continuous success in your business journey.\n\n` +
                `Thank you for learning with *Kairos*! 💚`
        }
      ]);
    } else {
      // Next module unlocked! Generate session and send WhatsApp button
      const nextMod = result.nextModule;
      const studentObj = {
        name: payload.name,
        phone: payload.phone,
        course: "Business Success Class",
        moduleId: nextMod
      };
      const { sessionId } = createShortSession(studentObj, 0, nextMod);
      nextClassroomUrl = `${baseUrl}/classroom/${sessionId}`;

      console.log(`[Auto Progression] Sending Module ${nextMod} link to WhatsApp (+${phone}): ${nextClassroomUrl}`);

      await whatsappService.sendMessageSequence(phone, [
        {
          type: "cta_url",
          header: `🎉 Module ${modId} Completed!`,
          body: `Superb job *${studentName}*! 🌟\n\n` +
                `You have completed *Module ${modId}* of your *Business Success Class*.\n\n` +
                `*Module ${nextMod}* is now unlocked and ready for you!\n` +
                `Tap below to continue to your next lesson:`,
          buttonText: `▶️ Start Module ${nextMod}`,
          url: nextClassroomUrl,
          footer: "Kairos"
        }
      ]);
    }
  } else {
    // If already completed previously, provide current unlocked module link
    if (result.nextModule && result.nextModule !== modId) {
      const studentObj = {
        name: payload.name,
        phone: payload.phone,
        course: "Business Success Class",
        moduleId: result.nextModule
      };
      const { sessionId } = createShortSession(studentObj, 0, result.nextModule);
      nextClassroomUrl = `${baseUrl}/classroom/${sessionId}`;
    }
  }

  res.json({
    success: true,
    completedModule: modId,
    nextModule: result.nextModule,
    allCompleted: result.allCompleted,
    nextClassroomUrl
  });
});

// 4. Authenticated Video Streaming for 6 Modules (video1.mp4 - video6.mp4)
app.get("/api/video/stream/:token", (req, res) => {
  const deviceSig = req.query.sig || req.headers["x-device-sig"];
  const resolved = resolveSession(req.params.token, deviceSig);
  if (!resolved || resolved.deviceMismatch || !resolved.payload) {
    return res.status(403).send("Unauthorized video stream.");
  }

  const payload = resolved.payload;
  let modId = Math.min(6, Math.max(1, Number(payload.moduleId) || 1));
  let videoFileName = `video${modId}.mp4`;

  let videoFilePath = path.join(mediaDir, videoFileName);
  if (!fs.existsSync(videoFilePath)) {
    videoFilePath = path.join(mediaDir, "video1.mp4");
  }

  if (!fs.existsSync(videoFilePath)) {
    return res.status(404).send("Course video file not found on server");
  }

  const stat = fs.statSync(videoFilePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader("Content-Disposition", 'inline; filename="lesson.mp4"');
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

  // Robust range request handling for Apple iOS Safari and mobile browsers
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    let start = 0;
    let end = fileSize - 1;

    if (parts[0] === "" && parts[1]) {
      // Suffix range: bytes=-500 (last 500 bytes)
      start = Math.max(0, fileSize - parseInt(parts[1], 10));
    } else {
      start = parseInt(parts[0], 10);
      if (parts[1]) {
        end = Math.min(fileSize - 1, parseInt(parts[1], 10));
      }
    }

    if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
      res.setHeader("Content-Range", `bytes */${fileSize}`);
      return res.status(416).send("Requested Range Not Satisfiable");
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(videoFilePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4"
    });

    fileStream.pipe(res);

    fileStream.on("error", (streamErr) => {
      console.warn("[Video Stream] Stream error:", streamErr.message);
      if (!res.headersSent) res.status(500).end();
    });

    req.on("close", () => {
      fileStream.destroy();
    });
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes"
    });

    const fileStream = fs.createReadStream(videoFilePath);
    fileStream.pipe(res);

    fileStream.on("error", (streamErr) => {
      console.warn("[Video Stream] Stream error:", streamErr.message);
      if (!res.headersSent) res.status(500).end();
    });

    req.on("close", () => {
      fileStream.destroy();
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found. Use /webhook for Meta Webhooks." });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[Internal Server Error]:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start the Express server
app.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================");
  console.log("🚀 Kairos Lite WhatsApp Chatbot Backend is LIVE");
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 Webhook GET/POST endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🩺 Health check endpoint: http://localhost:${PORT}/health`);
  console.log(`📋 Candidate leads endpoint: http://localhost:${PORT}/leads`);
  console.log(
    `📱 WhatsApp Number ID: ${
      process.env.WHATSAPP_PHONE_NUMBER_ID || "1441499925712464"
    }`
  );
  console.log(
    `🌐 Graph API Version: ${process.env.GRAPH_API_VERSION || "v26.0"}`
  );
  console.log("==================================================");
});
