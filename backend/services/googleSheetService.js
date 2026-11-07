const axios = require("axios");

const SCRIPT_URL = process.env.GOOGLE_SHEET_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzTStla0QbrBXi557uYRKTpJcimmhToTmTM4kvsXIAOa_WYGKUqMecK9nbaIlpTiFC-/exec";

// In-memory cache to ensure sub-second response times for repeat interactions
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Normalizes phone number to last 10 digits for accurate matching
 * e.g. "919500406150" -> "9500406150", "+91 9500406150" -> "9500406150"
 */
function normalizePhone(rawPhone) {
  if (!rawPhone) return "";
  const cleaned = String(rawPhone).replace(/\D/g, "");
  if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }
  return cleaned;
}

/**
 * Fetches student record from Google Sheets via Apps Script Web App.
 * Always queries live data so updates in Google Sheets (e.g. changing 'no' to 'yes')
 * take effect instantly in real-time.
 * 
 * @param {string} phone Student's phone number
 * @param {boolean} forceLive Always bypass cache
 * @returns {Promise<{success: boolean, student?: object, message?: string}>}
 */
async function getStudentByPhone(phone, forceLive = true) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { success: false, message: "Invalid phone number" };
  }

  // Short 2-second debounce cache to handle duplicate webhook bursts without delaying live edits
  const cached = cache.get(normalized);
  if (!forceLive && cached && (Date.now() - cached.timestamp < 2000)) {
    return { success: true, student: cached.data };
  }

  try {
    const response = await axios.post(
      SCRIPT_URL,
      { phone: normalized, action: "getStudent" },
      {
        timeout: 25000,
        maxRedirects: 5,
        headers: { "Content-Type": "application/json" }
      }
    );

    if (response.data && response.data.success && response.data.student) {
      const student = response.data.student;
      // Ensure progressSeconds is a number
      student.progressSeconds = Number(student.progressSeconds) || 0;
      // Clean and normalize paymentStatus (trim whitespace)
      student.paymentStatus = String(student.paymentStatus || "").trim().toLowerCase();
      cache.set(normalized, { data: student, timestamp: Date.now() });
      return { success: true, student };
    }

    return {
      success: false,
      message: response.data?.message || "Student not found"
    };
  } catch (error) {
    console.error(`[GoogleSheetService] Error fetching student (${normalized}):`, error.message);
    // If cached version exists, return as graceful offline fallback
    if (cached) {
      return { success: true, student: cached.data };
    }
    return { success: false, message: "Failed to connect to student records" };
  }
}

/**
 * Updates student's video watch progress in Google Sheets
 * 
 * @param {string} phone Student's phone number
 * @param {number} progressSeconds Watched timestamp in seconds
 * @returns {Promise<{success: boolean, updatedProgress?: number}>}
 */
async function updateStudentProgress(phone, progressSeconds) {
  const normalized = normalizePhone(phone);
  const seconds = Math.max(0, Math.floor(Number(progressSeconds) || 0));

  // Update in-memory cache immediately
  const cached = cache.get(normalized);
  if (cached) {
    cached.data.progressSeconds = seconds;
    cached.timestamp = Date.now();
  }

  try {
    const response = await axios.post(
      SCRIPT_URL,
      {
        phone: normalized,
        action: "updateProgress",
        progressSeconds: seconds
      },
      {
        timeout: 10000,
        maxRedirects: 5,
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log(`[GoogleSheetService] Progress synced for ${normalized}: ${seconds}s ->`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[GoogleSheetService] Error updating progress for ${normalized}:`, error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Invalidate cache for a phone number
 */
function invalidateCache(phone) {
  const normalized = normalizePhone(phone);
  cache.delete(normalized);
}

module.exports = {
  normalizePhone,
  getStudentByPhone,
  updateStudentProgress,
  invalidateCache
};
