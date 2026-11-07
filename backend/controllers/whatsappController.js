const whatsappService = require("../services/whatsappService");
const chatbotService = require("../services/chatbotService");
const { isDuplicateMessage } = require("../utils/conversationState");

/**
 * Handle Meta Webhook Verification (GET /webhook)
 * Meta calls this when you configure your Webhook URL in the Meta App Dashboard
 * Query parameters: hub.mode, hub.verify_token, hub.challenge
 */
function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const VERIFY_TOKEN =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    "sproutks_webhook_verify_token_2026";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WhatsApp webhook verified successfully");
      return res.status(200).send(challenge);
    } else {
      console.warn("WhatsApp webhook verification failed: token mismatch");
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400);
}

/**
 * Handle Incoming WhatsApp Messages & Events (POST /webhook)
 * Handles text, image, document, audio, video, button, interactive, and delivery statuses.
 */
async function handleWebhook(req, res) {
  // Safe logging of incoming webhook payload (access token is never in body)
  console.log("WhatsApp webhook:", JSON.stringify(req.body, null, 2));

  // Return HTTP 200 immediately to Meta
  res.status(200).send("EVENT_RECEIVED");

  try {
    const body = req.body;

    // Validate standard Meta Webhook structure
    if (!body || body.object !== "whatsapp_business_account") {
      return;
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      return;
    }

    // Handle delivery status updates (sent, delivered, read, failed)
    if (value.statuses && Array.isArray(value.statuses)) {
      for (const status of value.statuses) {
        console.log(
          `WhatsApp status update: ${status.status} for message ID ${status.id} (recipient: ${status.recipient_id})`
        );
        if (status.status === "failed") {
          console.error(
            `WhatsApp status failed: ${JSON.stringify(status.errors || status)}`
          );
        }
      }

      // If payload is solely status updates, return
      if (!value.messages || value.messages.length === 0) {
        return;
      }
    }

    // Check for incoming WhatsApp messages
    const messages = value.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return;
    }

    for (const message of messages) {
      const messageId = message.id;
      const from = String(message.from || "").replace(/\D/g, "");
      const messageType = message.type;
      const timestamp = Number(message.timestamp);

      // TEMPORARY IN-MEMORY DUPLICATE CHECK (No database connected yet)
      if (isDuplicateMessage(messageId)) {
        console.log(`[Duplicate Dropped] Message ID ${messageId} was already processed.`);
        continue;
      }

      // Stale message protection: ignore messages older than 5 minutes (300 seconds)
      if (timestamp) {
        const nowSec = Math.floor(Date.now() / 1000);
        const ageSec = nowSec - timestamp;
        if (ageSec > 300) {
          console.log(`[Stale Message Dropped] Message ID ${messageId} is ${ageSec}s old (> 300s). Skipping.`);
          continue;
        }
      }

      // Self-message loop protection
      const botPhone = (process.env.WHATSAPP_PHONE_NUMBER || "").replace(/\D/g, "");
      if (botPhone && from === botPhone) {
        console.log(`[Self Message Dropped] Ignoring message sent from bot's own number: +${from}`);
        continue;
      }

      let userText = "";
      let buttonId = null;

      // Parse incoming WhatsApp message by type
      switch (messageType) {
        case "text": {
          userText = message.text?.body || "";
          console.log("WhatsApp message received");
          console.log(`From: ${from}`);
          console.log(`Message ID: ${messageId}`);
          console.log(`Message: ${userText}`);
          break;
        }

        case "image": {
          const image = message.image || {};
          console.log("WhatsApp message received");
          console.log(`From: ${from}`);
          console.log(`Message ID: ${messageId}`);
          console.log(`Type: image | Image ID: ${image.id} | Caption: ${image.caption || "None"} | Mime: ${image.mime_type}`);
          userText = image.caption || "";
          break;
        }

        case "document": {
          const doc = message.document || {};
          console.log("WhatsApp message received");
          console.log(`From: ${from}`);
          console.log(`Message ID: ${messageId}`);
          console.log(`Type: document | Filename: ${doc.filename || "None"} | ID: ${doc.id} | Mime: ${doc.mime_type}`);
          break;
        }

        case "audio": {
          const audio = message.audio || {};
          console.log("WhatsApp message received");
          console.log(`From: ${from}`);
          console.log(`Message ID: ${messageId}`);
          console.log(`Type: audio | Audio ID: ${audio.id} | Voice: ${audio.voice ? "yes" : "no"} | Mime: ${audio.mime_type}`);
          break;
        }

        case "video": {
          const video = message.video || {};
          console.log("WhatsApp message received");
          console.log(`From: ${from}`);
          console.log(`Message ID: ${messageId}`);
          console.log(`Type: video | Video ID: ${video.id} | Caption: ${video.caption || "None"} | Mime: ${video.mime_type}`);
          userText = video.caption || "";
          break;
        }

        case "button": {
          const btn = message.button || {};
          userText = btn.text || "";
          buttonId = btn.payload || btn.text || null;
          console.log("WhatsApp message received");
          console.log(`From: ${from}`);
          console.log(`Message ID: ${messageId}`);
          console.log(`Type: quick_reply_button | Button: ${userText} | Payload: ${buttonId}`);
          break;
        }

        case "interactive": {
          const interactive = message.interactive;
          if (interactive?.type === "button_reply") {
            buttonId = interactive.button_reply?.id;
            userText = interactive.button_reply?.title || "";
            console.log("WhatsApp message received");
            console.log(`From: ${from}`);
            console.log(`Message ID: ${messageId}`);
            console.log(`Type: interactive button_reply | ID: ${buttonId} | Title: ${userText}`);
          } else if (interactive?.type === "list_reply") {
            buttonId = interactive.list_reply?.id;
            userText = interactive.list_reply?.title || "";
            console.log("WhatsApp message received");
            console.log(`From: ${from}`);
            console.log(`Message ID: ${messageId}`);
            console.log(`Type: interactive list_reply | ID: ${buttonId} | Title: ${userText}`);
          }
          break;
        }

        default: {
          console.log("WhatsApp message received");
          console.log(`From: ${from}`);
          console.log(`Message ID: ${messageId}`);
          console.log(`Type: ${messageType} (unhandled/system event)`);
          break;
        }
      }

      // Mark message as read asynchronously in background
      whatsappService.markAsRead(messageId).catch(() => {});

      // Forward to Chatbot Service if there is readable text or button action
      if (userText || buttonId) {
        try {
          const botReplies = await chatbotService.processMessage(from, userText, buttonId, messageId);
          if (botReplies && botReplies.length > 0) {
            await whatsappService.sendMessageSequence(from, botReplies);
          }
        } catch (botErr) {
          console.error(`[Chatbot Engine Error] Error processing message from +${from}:`, botErr.message);
        }
      }
    }
  } catch (error) {
    console.error("[Webhook Error] Unexpected error processing incoming event:", error.message);
  }
}

module.exports = {
  verifyWebhook,
  handleWebhook
};
