const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "student_progress.json");

/**
 * In-memory cache + persistent JSON storage for 12-Module student progress.
 */
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      return JSON.parse(raw) || {};
    }
  } catch (err) {
    console.warn("[StudentProgressService] Error reading progress data:", err.message);
  }
  return {};
}

function saveData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[StudentProgressService] Error writing progress data:", err.message);
  }
}

function normalizePhone(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
}

/**
 * Get student's current module and progression state
 * 
 * @param {string} rawPhone 
 * @returns {{ currentModule: number, completedModules: number[], moduleProgress: object }}
 */
function getStudentProgress(rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { currentModule: 1, completedModules: [], moduleProgress: {} };
  }

  const all = loadData();
  if (!all[phone]) {
    all[phone] = {
      currentModule: 1,
      completedModules: [],
      moduleProgress: {},
      lastUpdated: Date.now()
    };
    saveData(all);
  }

  const record = all[phone];
  record.currentModule = Number(record.currentModule) || 1;
  if (record.currentModule < 1) record.currentModule = 1;
  if (record.currentModule > 6) record.currentModule = 6;
  if (!Array.isArray(record.completedModules)) record.completedModules = [];
  if (!record.moduleProgress || typeof record.moduleProgress !== "object") record.moduleProgress = {};

  return record;
}

/**
 * Updates watched seconds for a specific module
 */
function setModuleProgress(rawPhone, moduleId, seconds) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return;

  const modNum = Math.min(6, Math.max(1, Number(moduleId) || 1));
  const s = Math.max(0, Math.floor(Number(seconds) || 0));

  const all = loadData();
  if (!all[phone]) {
    all[phone] = { currentModule: modNum, completedModules: [], moduleProgress: {}, lastUpdated: Date.now() };
  }

  all[phone].moduleProgress[String(modNum)] = s;
  all[phone].lastUpdated = Date.now();
  saveData(all);
}

/**
 * Marks a module as completed and unlocks next module
 * 
 * @param {string} rawPhone 
 * @param {number} moduleId 
 * @returns {{ isNewlyCompleted: boolean, completedModule: number, nextModule: number, allCompleted: boolean }}
 */
function completeModule(rawPhone, moduleId) {
  const phone = normalizePhone(rawPhone);
  const modNum = Math.min(6, Math.max(1, Number(moduleId) || 1));

  const all = loadData();
  if (!all[phone]) {
    all[phone] = { currentModule: modNum, completedModules: [], moduleProgress: {}, lastUpdated: Date.now() };
  }

  const record = all[phone];
  if (!Array.isArray(record.completedModules)) {
    record.completedModules = [];
  }

  const isNewlyCompleted = !record.completedModules.includes(modNum);
  if (isNewlyCompleted) {
    record.completedModules.push(modNum);
    record.completedModules.sort((a, b) => a - b);
  }

  // Advance to next module if finishing the current highest module
  let nextModule = modNum + 1;
  if (nextModule > 6) {
    nextModule = 6;
  }

  if (record.currentModule <= modNum && modNum < 6) {
    record.currentModule = nextModule;
  }

  record.lastUpdated = Date.now();
  saveData(all);

  const allCompleted = record.completedModules.length >= 6;

  console.log(`[StudentProgress] Student ${phone} completed Module ${modNum} (New: ${isNewlyCompleted}) | Next: Module ${nextModule} | Total Completed: ${record.completedModules.length}/6`);

  return {
    isNewlyCompleted,
    completedModule: modNum,
    nextModule,
    allCompleted,
    totalCompleted: record.completedModules.length
  };
}

/**
 * Reset progress to beginning (00:00) of specified module
 */
function resetProgress(rawPhone, moduleId = null) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return;

  const all = loadData();
  if (all[phone]) {
    if (moduleId) {
      all[phone].moduleProgress[String(moduleId)] = 0;
    } else {
      all[phone].currentModule = 1;
      all[phone].completedModules = [];
      all[phone].moduleProgress = {};
    }
    all[phone].lastUpdated = Date.now();
    saveData(all);
  }
}

module.exports = {
  getStudentProgress,
  setModuleProgress,
  completeModule,
  resetProgress
};

