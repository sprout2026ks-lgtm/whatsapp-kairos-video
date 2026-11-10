const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const fs = require("fs");
const whatsappService = require("../services/whatsappService");
const googleSheetService = require("../services/googleSheetService");

function capitalize(str) {
  if (!str) return "Student";
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const recipients = [
  { phone: "9500070756", fullPhone: "919500070756", defaultName: "Senthikumar" },
  { phone: "9866011294", fullPhone: "919866011294", defaultName: "Shailendra" },
  { phone: "9500406150", fullPhone: "919500406150", defaultName: "Sabari" }
];

async function sendAllGreetingsViaTemplate() {
  console.log("==================================================");
  console.log("🚀 Sending Template Greetings (24/7 Delivery Bypassing 24-hr Window)");
  console.log("==================================================");

  for (const item of recipients) {
    try {
      let userName = item.defaultName;
      try {
        const sheetRes = await googleSheetService.getStudentByPhone(item.phone);
        if (sheetRes.success && sheetRes.student?.name) {
          userName = capitalize(sheetRes.student.name);
        }
      } catch (err) {
        console.warn(`[Warning] Sheet query fallback for ${item.phone}: ${err.message}`);
      }

      console.log(`\n📨 Dispatching template 'kairos_study_greeting' to ${userName} (+${item.fullPhone})...`);

      // sendTemplateMessage(phone, templateName, [variable1_name], language)
      const result = await whatsappService.sendTemplateMessage(
        item.fullPhone,
        "kairos_study_greeting",
        [userName],
        "en_US"
      );

      if (result && result.messages && result.messages[0]) {
        console.log(`✅ SUCCESS: Delivered to ${userName} (+${item.fullPhone}). Meta Message ID: ${result.messages[0].id}`);
      } else {
        console.error(`❌ Meta API returned:`, JSON.stringify(result));
      }
    } catch (err) {
      console.error(`❌ Exception sending to ${item.fullPhone}:`, err.message);
    }
  }

  console.log("\n==================================================");
  console.log("🏁 All template greetings processed.");
  console.log("==================================================");
}

sendAllGreetingsViaTemplate();
