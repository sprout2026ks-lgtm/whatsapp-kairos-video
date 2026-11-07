const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const whatsappService = require("./services/whatsappService");

async function runTestSend() {
  const recipient = process.argv[2];

  if (!recipient) {
    console.log("ℹ️ Usage: node test-send-whatsapp.js <PHONE_NUMBER_WITH_COUNTRY_CODE>");
    console.log("Example: node test-send-whatsapp.js 919876543210");
    console.log("Note: In Meta WhatsApp Cloud API, you must specify a customer/client phone number (cannot be the bot's own number +919629531891).");
    return;
  }

  console.log(`🚀 Sending Kairos Lite test messages to +${recipient}...`);

  // 1. Send Welcome Text
  console.log("1. Sending Welcome text...");
  await whatsappService.sendTextMessage(
    recipient,
    "Welcome to Kairos Lite. I help you find a job, an internship or a course, for free."
  );

  // 2. Send Consent Buttons
  console.log("2. Sending Consent button message...");
  await whatsappService.sendButtonMessage(
    recipient,
    "Do you agree that we use your answers to suggest suitable offers?",
    [
      { id: "agree", title: "I agree" },
      { id: "more_info", title: "More info" }
    ]
  );

  console.log("✅ Test sequence dispatched!");
}

runTestSend();
