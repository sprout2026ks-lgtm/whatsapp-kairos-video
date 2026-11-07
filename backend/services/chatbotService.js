/**
 * Chatbot Service - SproutKs Student Course & DRM Video Flow
 * 
 * Features:
 * 1. Analyzes incoming phone number against Google Sheet student database.
 * 2. Personalized greeting with registered course (Python, Java, etc.).
 * 3. Exact video resume timestamp synced directly with Google Sheets.
 * 4. Senior Developer DRM Protection:
 *    - Tokenized secure Web Player (nodownload, no contextmenu, no devtools).
 *    - Dynamic moving watermark with student name & phone to prevent screen recording / leaks.
 *    - Auto-syncs watched seconds back to Google Sheets every 5 seconds.
 */

const googleSheetService = require("./googleSheetService");
const studentProgressService = require("./studentProgressService");
const { createPlayerToken, createShortSession } = require("../utils/playerToken");
const {
  getConversationState,
  updateConversationState,
  resetConversationState
} = require("../utils/conversationState");

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
  const s = Math.floor(Number(seconds) || 0);
  if (s <= 0) return "00:00 (Not started)";
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Capitalize string
 */
function capitalize(str) {
  if (!str) return "";
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

/**
 * Validates if student paymentStatus in Google Sheets is completed
 */
function isPaymentCompleted(status) {
  if (status === undefined || status === null) return false;
  const s = String(status).trim().toLowerCase();
  return (
    s === "yes" ||
    s === "y" ||
    s === "paid" ||
    s === "true" ||
    s === "1" ||
    s === "completed" ||
    s.startsWith("y") ||
    s.includes("paid")
  );
}

/**
 * Main processMessage handler called by webhook controller
 *
 * @param {string} phone Sender's phone number without symbols (e.g. "919500406150")
 * @param {string} userMessage Text sent by the user
 * @param {string|null} buttonId ID of button or list item clicked
 * @param {string} messageId WhatsApp incoming message ID
 * @returns {Promise<Array<object>>} Sequence of messages to send to WhatsApp
 */
async function processMessage(phone, userMessage = "", buttonId = null, messageId = null) {
  const text = (userMessage || "").trim().toLowerCase();
  const rawBtn = buttonId || "";

  console.log(`[Chatbot] Incoming message from +${phone} | Text: "${userMessage}" | ButtonID: "${rawBtn}"`);

  // 1. Query Google Sheets for Student Profile
  const sheetResult = await googleSheetService.getStudentByPhone(phone);

  // CASE 1: Student not found in Google Sheets (Unregistered Visitor)
  if (!sheetResult.success || !sheetResult.student) {
    const defaultBaseUrl = (process.env.SERVER_BASE_URL || "https://sentences-david-shirts-fathers.trycloudflare.com").replace(/\/$/, "");
    return [
      {
        type: "image",
        url: `${defaultBaseUrl}/media/kairos_img.jpeg`
      },
      {
        type: "text",
        text: `This is Kairos - Your Favourite Teacher. Lets start your Business Success Class. Wish you a Happy Learning\n\n` +
              `👋 *Welcome to Kairos*\n*Bienvenue sur Kairos*\n\n` +
              `Please register to start your courses using the links below / Veuillez vous inscrire pour commencer vos cours en utilisant les liens ci-dessous :\n\n` +
              `🇬🇧 *English:*\n👉 https://reg-fe-and-sme-sprout.web.app\n\n` +
              `🇫🇷 *Français :*\n👉 https://reg-feandsme-sprout.web.app/registration`
      }
    ];
  }

  const student = sheetResult.student;
  const studentName = capitalize(student.name);
  const courseName = "Business Success Class";
  const isPaid = isPaymentCompleted(student.paymentStatus);

  // Retrieve 12-Module progress state
  const progressData = studentProgressService.getStudentProgress(phone);
  const currentModule = progressData.currentModule || 1;
  const currentModProgress = Number(progressData.moduleProgress[String(currentModule)]) || 0;
  const progressFormatted = formatDuration(currentModProgress);
  const completedCount = Array.isArray(progressData.completedModules) ? progressData.completedModules.length : 0;
  const baseUrl = (process.env.SERVER_BASE_URL || "https://sentences-david-shirts-fathers.trycloudflare.com").replace(/\/$/, "");

  // ========================================================
  // UNPAID / PENDING STUDENTS (paymentStatus === 'no')
  // Block video access and instruct: "do payment to continue courses"
  // ========================================================
  if (!isPaid) {
    console.log(`[Access Control] Student ${studentName} (+91 ${student.phone}) paymentStatus is '${student.paymentStatus}'. Video access LOCKED.`);

    // If user clicked [💳 Do Payment] or asked about registration/payment
    if (rawBtn === "DO_PAYMENT" || rawBtn === "REGISTER_CLASS" || text.includes("pay") || text.includes("register") || text.includes("fee") || text.includes("enroll")) {
      return [
        {
          type: "text",
          text: `🎓 *Kairos - Course Payment & Activation*\n\n` +
                `Hello *${studentName}*,\n\n` +
                `⚠️ *Please do payment to continue courses.*\n\n` +
                `To complete your registration and unlock your *${courseName} Masterclass* video lessons, choose your language below:\n\n` +
                `🇬🇧 *English Registration & Payment:*\n👉 https://reg-fe-and-sme-sprout.web.app\n\n` +
                `🇫🇷 *Inscription et Paiement en Français :*\n👉 https://reg-feandsme-sprout.web.app/registration\n\n` +
                `Once payment is confirmed, all video lessons will unlock automatically on WhatsApp!`
        }
      ];
    }

    // If user clicked [Contact Support]
    if (rawBtn === "CONTACT_SUPPORT" || text.includes("support") || text.includes("contact") || text.includes("help")) {
      return [
        {
          type: "button",
          header: "📞 Admissions & Support",
          body: `*Kairos Student Helpdesk:*\n\n` +
                `👤 *Advisor:* Admissions & Accounts\n` +
                `📱 *Helpline:* +91 70104 72311\n` +
                `⏰ *Timings:* Mon - Sat (9:00 AM - 7:00 PM)\n\n` +
                `⚠️ *Please do payment to continue courses.*\n` +
                `Contact our helpline if you need any assistance with fee payment or enrollment.`,
          buttons: [
            { id: "DO_PAYMENT", title: "💳 Do Payment" },
            { id: "COURSE_INFO", title: "📋 Course Details" }
          ],
          footer: "Kairos"
        }
      ];
    }

    // If user clicked [Course Details]
    if (rawBtn === "COURSE_INFO" || text.includes("info") || text.includes("detail")) {
      return [
        {
          type: "button",
          header: "📋 Course Enrollment Status",
          body: `👤 *Student:* ${studentName}\n` +
                `📱 *Phone:* +91 ${student.phone}\n` +
                `📚 *Course:* ${courseName}\n` +
                `💳 *Payment Status:* ❌ *Pending / Not Paid*\n\n` +
                `⚠️ *Please do payment to continue courses.*\n\n` +
                `Video lessons and classroom access remain locked until payment is verified.`,
          buttons: [
            { id: "DO_PAYMENT", title: "💳 Do Payment" },
            { id: "CONTACT_SUPPORT", title: "📞 Contact Support" }
          ],
          footer: "Kairos"
        }
      ];
    }

    // Default Greeting for Unpaid Students: "Please do payment to continue courses"
    return [
      {
        type: "image",
        url: `${baseUrl}/media/kairos_img.jpeg`
      },
      {
        type: "button",
        header: `👋 Hello ${studentName}!`,
        body: `This is Kairos - Your Favourite Teacher. Lets start your Business Success Class. Wish you a Happy Learning\n\n` +
              `⚠️ *Please do payment to continue courses.*\n\n` +
              `Your video lessons are locked until course fee payment is received. Tap *Do Payment* below to proceed!`,
        buttons: [
          { id: "DO_PAYMENT", title: "💳 Do Payment" },
          { id: "CONTACT_SUPPORT", title: "📞 Contact Support" },
          { id: "COURSE_INFO", title: "📋 Course Details" }
        ],
        footer: "Kairos"
      }
    ];
  }

  // ========================================================
  // PAID STUDENTS (paymentStatus === 'yes')
  // Full access: Send native video directly in WhatsApp!
  // ========================================================

  // CASE 2: User clicked [▶️ Start Class] or requested video playback
  if (
    rawBtn === "START_CLASS" ||
    rawBtn === "RESUME_MODULE_1" ||
    text.includes("start class") ||
    text.includes("start course") ||
    text.includes("start the course") ||
    text.includes("start") ||
    text.includes("resume") ||
    text.includes("play") ||
    text.includes("module") ||
    text.includes("video") ||
    text.includes("watch")
  ) {
    const studentObj = {
      name: student.name,
      phone: student.phone,
      course: "Business Success Class",
      moduleId: currentModule
    };
    const { sessionId } = createShortSession(studentObj, currentModProgress, currentModule);
    const classroomUrl = `${baseUrl}/classroom/${sessionId}`;

    const resumeNotice = currentModProgress > 0
      ? `▶️ Resuming Module ${currentModule} from: *${progressFormatted}*`
      : `▶️ Starting Module ${currentModule} from: *00:00*`;

    return [
      {
        type: "cta_url",
        header: `🎥 Module ${currentModule}: Business Success Class`,
        body: `Hello *${studentName}*!\n\n` +
              `Your *Business Success Class - Module ${currentModule}* classroom is ready.\n\n` +
              `${resumeNotice}\n\n` +
              `Tap the button below to start your class:`,
        buttonText: `▶️ Open Module ${currentModule}`,
        url: classroomUrl,
        footer: "Kairos"
      }
    ];
  }

  // CASE 3: User clicked [🔄 Start from 00:00] (Reset progress)
  if (
    rawBtn === "RESET_MODULE_1" ||
    text.includes("reset") ||
    text.includes("beginning") ||
    text.includes("start over")
  ) {
    // Reset progress in studentProgressService
    studentProgressService.setModuleProgress(phone, currentModule, 0);
    await googleSheetService.updateStudentProgress(phone, 0).catch(() => {});

    const studentObj = {
      name: student.name,
      phone: student.phone,
      course: "Business Success Class",
      moduleId: currentModule
    };
    const { sessionId } = createShortSession(studentObj, 0, currentModule);
    const classroomUrl = `${baseUrl}/classroom/${sessionId}`;

    return [
      {
        type: "cta_url",
        header: `🔄 Progress Reset to 00:00`,
        body: `Hello *${studentName}*, your Module ${currentModule} lesson has been reset to the beginning.\n\n` +
              `Tap below to start playing from 00:00:`,
        buttonText: `▶️ Open Module ${currentModule} (00:00)`,
        url: classroomUrl,
        footer: "Kairos"
      }
    ];
  }

  // CASE 4: User clicked [📋 Course Details] or asked for profile/info
  if (
    rawBtn === "COURSE_INFO" ||
    text.includes("info") ||
    text.includes("detail") ||
    text.includes("profile") ||
    text.includes("status")
  ) {
    return [
      {
        type: "button",
        header: "🎓 Student Course Profile",
        body: `👤 *Name:* ${studentName}\n` +
              `📱 *Phone:* +91 ${student.phone}\n` +
              `📚 *Enrolled Course:* Business Success Class (6 Modules)\n` +
              `📍 *Active Lesson:* Module ${currentModule} of 6\n` +
              `⏱️ *Module ${currentModule} Progress:* ${progressFormatted}\n` +
              `🏆 *Completed:* ${completedCount} / 6 Modules\n` +
              `💳 *Classroom Access:* ✅ Active & Verified`,
        buttons: [
          { id: "START_CLASS", title: `▶️ Start Module ${currentModule}` },
          { id: "RESET_MODULE_1", title: "🔄 Start from 00:00" }
        ],
        footer: "Kairos"
      }
    ];
  }

  // CASE 5: Default Greeting & Onboarding for Paid Students
  return [
    {
      type: "image",
      url: `${baseUrl}/media/kairos_img.jpeg`
    },
    {
      type: "button",
      header: `👋 Hello ${studentName}!`,
      body: `This is Kairos - Your Favourite Teacher. Lets start your Business Success Class. Wish you a Happy Learning`,
      buttons: [
        { id: "START_CLASS", title: "▶️ Start Class" },
        { id: "RESET_MODULE_1", title: "🔄 Start from 00:00" },
        { id: "COURSE_INFO", title: "📋 Course Details" }
      ],
      footer: "Kairos"
    }
  ];
}

module.exports = {
  processMessage,
  formatDuration
};
