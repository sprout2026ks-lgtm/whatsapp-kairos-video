const fs = require("fs");
const path = require("path");

// In-memory conversation state keyed by phone number
const conversationStore = new Map();

// Clean up duplicate message cache every 15 minutes (keep 30 mins)
const DEDUPLICATION_TTL_MS = 30 * 60 * 1000;
// Conversation session expiry: 45 minutes of inactivity
const CONVERSATION_TTL_MS = 45 * 60 * 1000;

// Path to persistent storage
const SESSIONS_FILE = path.join(__dirname, "..", "data", "conversation_sessions.json");
const PROCESSED_MESSAGES_FILE = path.join(__dirname, "..", "data", "processed_messages.json");

// In-memory cache of processed Meta WhatsApp Message IDs
const processedMessages = new Map();

function initSessions() {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
      if (typeof data === "object" && data !== null) {
        const now = Date.now();
        for (const [phone, sess] of Object.entries(data)) {
          if (sess && now - (sess.lastUpdated || 0) < CONVERSATION_TTL_MS) {
            conversationStore.set(phone, sess);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Sessions Storage] Error initializing store:", err.message);
  }
}
initSessions();

function saveSessionsToDisk() {
  try {
    const obj = {};
    const now = Date.now();
    for (const [phone, sess] of conversationStore.entries()) {
      if (now - (sess.lastUpdated || 0) < CONVERSATION_TTL_MS) {
        obj[phone] = sess;
      }
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch (err) {
    // Non-critical
  }
}

function initProcessedMessages() {
  try {
    const dir = path.dirname(PROCESSED_MESSAGES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(PROCESSED_MESSAGES_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROCESSED_MESSAGES_FILE, "utf8"));
      if (Array.isArray(data)) {
        const now = Date.now();
        for (const item of data) {
          if (item && item.id && item.time && now - item.time < DEDUPLICATION_TTL_MS) {
            processedMessages.set(item.id, item.time);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Processed Messages] Error initializing store:", err.message);
  }
}
initProcessedMessages();

function saveProcessedMessagesToDisk() {
  try {
    const entries = [];
    const now = Date.now();
    for (const [id, time] of processedMessages.entries()) {
      if (now - time < DEDUPLICATION_TTL_MS) {
        entries.push({ id, time });
      }
    }
    const trimmed = entries.slice(-1000);
    fs.writeFileSync(PROCESSED_MESSAGES_FILE, JSON.stringify(trimmed), "utf8");
  } catch (err) {
    // Non-critical
  }
}

/**
 * Check if a WhatsApp message ID has already been processed (Deduplication)
 */
function isDuplicateMessage(messageId) {
  if (!messageId) return false;
  const now = Date.now();

  for (const [id, time] of processedMessages.entries()) {
    if (now - time > DEDUPLICATION_TTL_MS) {
      processedMessages.delete(id);
    }
  }

  if (processedMessages.has(messageId)) {
    return true;
  }

  processedMessages.set(messageId, now);
  saveProcessedMessagesToDisk();
  return false;
}

/**
 * Get the current conversation state for a phone number
 * @param {string} phone
 * @returns {object} { step: string, data: object, lastUpdated: number }
 */
function getConversationState(phone) {
  if (!phone) return null;
  const now = Date.now();

  if (conversationStore.has(phone)) {
    const session = conversationStore.get(phone);
    if (now - session.lastUpdated < CONVERSATION_TTL_MS) {
      return session;
    } else {
      conversationStore.delete(phone);
    }
  }

  const newSession = {
    step: "START",
    data: {},
    lastUpdated: now
  };
  conversationStore.set(phone, newSession);
  return newSession;
}

/**
 * Update conversation state for a phone number
 * @param {string} phone
 * @param {object} updates e.g. { step: "STEP_NAME", data: { name: "John" } }
 */
function updateConversationState(phone, updates = {}) {
  const current = getConversationState(phone);
  const updated = {
    ...current,
    ...updates,
    data: {
      ...(current.data || {}),
      ...(updates.data || {})
    },
    lastUpdated: Date.now()
  };
  conversationStore.set(phone, updated);
  saveSessionsToDisk();
  return updated;
}

/**
 * Reset conversation state for a phone number back to START
 */
function resetConversationState(phone) {
  const newSession = {
    step: "START",
    data: {},
    lastUpdated: Date.now()
  };
  conversationStore.set(phone, newSession);
  saveSessionsToDisk();
  return newSession;
}

/**
 * Clear all sessions from memory and disk
 */
function clearAllSessions() {
  conversationStore.clear();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}), "utf8");
    }
  } catch (err) {}
}

module.exports = {
  isDuplicateMessage,
  getConversationState,
  updateConversationState,
  resetConversationState,
  clearAllSessions
};
