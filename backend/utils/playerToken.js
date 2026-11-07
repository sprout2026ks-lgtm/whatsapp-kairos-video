const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SECRET_KEY = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "sproutks_super_secret_player_key_2026";

/**
 * Creates a signed token containing student info and expiration
 */
function createPlayerToken(student, startProgress = 0, moduleId = 1) {
  const modId = Math.min(6, Math.max(1, Number(moduleId || student?.moduleId) || 1));
  const payload = {
    phone: String(student.phone),
    name: student.name,
    course: "Business Success Class",
    moduleId: modId,
    startProgress: Math.floor(Number(startProgress) || 0),
    exp: Date.now() + (48 * 60 * 60 * 1000) // 48 hours validity
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payloadStr)
    .digest("base64url");

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies and decodes player token
 */
function verifyPlayerToken(token) {
  try {
    if (!token || typeof token !== "string" || !token.includes(".")) {
      return null;
    }

    const [payloadStr, signature] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(payloadStr)
      .digest("base64url");

    if (signature !== expectedSig) {
      console.warn("[Player Token] Invalid signature");
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
    if (Date.now() > payload.exp) {
      console.warn("[Player Token] Token expired");
      return null;
    }

    return payload;
  } catch (err) {
    console.error("[Player Token] Verification failed:", err.message);
    return null;
  }
}

const fs = require("fs");
const SESSIONS_FILE = path.join(__dirname, "..", "data", "sessions.json");

function loadSessionsFromFile() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const content = fs.readFileSync(SESSIONS_FILE, "utf8");
      return JSON.parse(content) || {};
    }
  } catch (e) {}
  return {};
}

function saveSessionsToFile(data) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

/**
 * Creates a short, clean session ID (e.g. 8 chars) mapped to the signed token.
 * Automatically invalidates previous sessions for the same phone to prevent multi-device sharing.
 */
function createShortSession(student, startProgress = 0, moduleId = 1) {
  const modId = Math.min(6, Math.max(1, Number(moduleId || student?.moduleId) || 1));
  const token = createPlayerToken(student, startProgress, modId);
  const sessionId = crypto.randomBytes(4).toString("hex");
  const sessions = loadSessionsFromFile();
  const cleanPhone = String(student.phone);

  // Invalidate older sessions for this phone so only the latest WhatsApp link is active
  for (const [key, val] of Object.entries(sessions)) {
    if (val.phone === cleanPhone) {
      delete sessions[key];
    }
  }

  sessions[sessionId] = {
    token,
    phone: cleanPhone,
    name: student.name,
    course: "Business Success Class",
    moduleId: modId,
    boundDeviceId: null, // First device that opens this link locks it
    boundUserAgent: null,
    createdAt: Date.now(),
    exp: Date.now() + (48 * 60 * 60 * 1000)
  };

  saveSessionsToFile(sessions);
  return { sessionId, token, moduleId: modId };
}

/**
 * Binds a session to a specific device signature upon first open.
 * If opened on a different device, rejects with DEVICE_MISMATCH.
 */
function bindSessionDevice(sessionId, deviceSig, userAgent = "") {
  if (!sessionId || !deviceSig) {
    return { success: false, reason: "MISSING_PARAMS" };
  }

  const sessions = loadSessionsFromFile();
  const sess = sessions[sessionId];

  if (!sess) {
    return { success: false, reason: "SESSION_NOT_FOUND" };
  }

  if (Date.now() > sess.exp) {
    delete sessions[sessionId];
    saveSessionsToFile(sessions);
    return { success: false, reason: "EXPIRED" };
  }

  // First device open: lock to this device signature
  if (!sess.boundDeviceId) {
    sess.boundDeviceId = String(deviceSig);
    sess.boundUserAgent = String(userAgent).slice(0, 200);
    sess.boundAt = Date.now();
    saveSessionsToFile(sessions);
    return { success: true, bound: true, firstBind: true, session: sess };
  }

  // Subsequent open: verify it is the EXACT same device
  if (sess.boundDeviceId === String(deviceSig)) {
    return { success: true, bound: true, firstBind: false, session: sess };
  }

  // Device mismatch! The link was shared/forwarded to someone else
  console.warn(`[Anti-Sharing Violation] Session ${sessionId} (Phone: ${sess.phone}) was opened on unauthorized device! Expected: ${sess.boundDeviceId}, Received: ${deviceSig}`);
  return {
    success: false,
    bound: false,
    reason: "DEVICE_MISMATCH",
    phone: sess.phone,
    name: sess.name
  };
}

/**
 * Resolves either a short session ID or a full token with strict device verification
 */
function resolveSession(idOrToken, deviceSig = null) {
  if (!idOrToken || typeof idOrToken !== "string") return null;

  const sessions = loadSessionsFromFile();
  let sess = sessions[idOrToken];

  // If not found by session ID, search by full token value
  if (!sess) {
    for (const val of Object.values(sessions)) {
      if (val.token === idOrToken) {
        sess = val;
        break;
      }
    }
  }

  if (sess) {
    if (Date.now() > sess.exp) {
      return null;
    }

    // Check device signature if session has already been bound
    if (sess.boundDeviceId && (!deviceSig || sess.boundDeviceId !== String(deviceSig))) {
      return {
        deviceMismatch: true,
        phone: sess.phone,
        name: sess.name
      };
    }

    const payload = verifyPlayerToken(sess.token);
    return payload ? { token: sess.token, payload, boundDeviceId: sess.boundDeviceId } : null;
  }

  // If not in active sessions store, raw tokens require a registered session
  return null;
}

module.exports = {
  createPlayerToken,
  verifyPlayerToken,
  createShortSession,
  bindSessionDevice,
  resolveSession
};
