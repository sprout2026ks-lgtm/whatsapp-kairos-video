const axios = require("axios");

/**
 * Service to handle Meta WhatsApp Cloud API REST interactions
 * Supports Plain Text, Interactive Button Messages, and Interactive List Messages.
 */
class WhatsAppService {
  constructor() {
    // Dynamic getters ensure runtime updates to process.env are always used
  }

  getBaseUrl() {
    const graphApiVersion = process.env.GRAPH_API_VERSION || "v26.0";
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1441499925712464";
    return `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}`;
  }

  /**
   * Clean recipient phone number (strip non-digits)
   */
  cleanPhone(to) {
    return String(to || "").replace(/\D/g, "");
  }

  /**
   * Authorization headers for Meta Graph API
   */
  getHeaders() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token || token === "YOUR_SYSTEM_USER_ACCESS_TOKEN") {
      console.warn("[WhatsApp Service Warning] WHATSAPP_ACCESS_TOKEN is missing or not configured in .env!");
    }
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }

  /**
   * Central API caller with error handling
   */
  async executeSend(payload) {
    const url = `${this.getBaseUrl()}/messages`;
    try {
      const response = await axios.post(url, payload, {
        headers: this.getHeaders(),
        timeout: 15000
      });
      const msgId = response.data?.messages?.[0]?.id || "OK";
      console.log(`[WhatsApp Outbound Success] Delivered message ID: ${msgId} to ${payload.to}`);
      return response.data;
    } catch (error) {
      const status = error.response ? error.response.status : "NETWORK_ERROR";
      const errorData = error.response?.data?.error || {};
      const errorMessage = errorData.message || error.message;
      const errorCode = errorData.code || "N/A";
      const fbtraceId = errorData.fbtrace_id || "N/A";

      console.error(`[WhatsApp API Error] Status: ${status} | Code: ${errorCode} | TraceID: ${fbtraceId}`);
      console.error(`[WhatsApp API Error Details]: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Send a standard text message
   * 
   * @param {string} to WhatsApp phone number
   * @param {string} text The message body text
   */
  async sendTextMessage(to, text) {
    if (!to || !text) {
      console.error("[WhatsApp Service] Missing recipient phone or message text.");
      return null;
    }
    const cleanTo = this.cleanPhone(to);
    const hasUrl = /https?:\/\//i.test(text);
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "text",
      text: {
        preview_url: hasUrl,
        body: text
      }
    };
    return this.executeSend(payload);
  }

  /**
   * Send a native Image message directly in WhatsApp
   * 
   * @param {string} to WhatsApp phone number
   * @param {string} imageUrl Direct HTTPS link to JPG/PNG image
   * @param {string} [caption] Optional caption to display directly on the image
   */
  async sendImageMessage(to, imageUrl, caption = "") {
    if (!to || !imageUrl) {
      console.error("[WhatsApp Service] Missing recipient phone or image URL.");
      return null;
    }
    const cleanTo = this.cleanPhone(to);
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "image",
      image: {
        link: imageUrl,
        caption: caption ? String(caption).slice(0, 1024) : undefined
      }
    };
    return this.executeSend(payload);
  }

  /**
   * Send a native Video message that plays inline inside WhatsApp
   * 
   * @param {string} to WhatsApp phone number
   * @param {string} videoUrl Direct HTTPS link to MP4 video
   * @param {string} [caption] Optional caption to display directly on the video
   */
  async sendVideoMessage(to, videoUrl, caption = "") {
    if (!to || !videoUrl) {
      console.error("[WhatsApp Service] Missing recipient phone or video URL.");
      return null;
    }
    const cleanTo = this.cleanPhone(to);
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "video",
      video: {
        link: videoUrl,
        caption: caption ? String(caption).slice(0, 1024) : undefined
      }
    };
    return this.executeSend(payload);
  }

  /**
   * Send a native Audio message that plays directly inside WhatsApp
   * 
   * @param {string} to WhatsApp phone number
   * @param {string} audioUrl Direct HTTPS link to MP3/AAC/OGG audio
   */
  async sendAudioMessage(to, audioUrl) {
    if (!to || !audioUrl) {
      console.error("[WhatsApp Service] Missing recipient phone or audio URL.");
      return null;
    }
    const cleanTo = this.cleanPhone(to);
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "audio",
      audio: {
        link: audioUrl
      }
    };
    return this.executeSend(payload);
  }

  /**
   * Send an Interactive Quick Reply Button Message (1 to 3 buttons)
   * 
   * @param {string} to WhatsApp phone number
   * @param {string} bodyText Main message text
   * @param {Array<{id: string, title: string}>} buttons Array of buttons (max 3, title max 20 chars)
   * @param {string} [headerText] Optional header text
   * @param {string} [footerText] Optional footer text
   */
  async sendButtonMessage(to, bodyText, buttons = [], headerText = null, footerText = null) {
    if (!to || !bodyText || !buttons.length) {
      console.error("[WhatsApp Service] Missing parameters for button message.");
      return null;
    }

    const cleanTo = this.cleanPhone(to);

    // Meta WhatsApp Cloud API limits buttons to max 3, title max 20 chars
    const formattedButtons = buttons.slice(0, 3).map(btn => ({
      type: "reply",
      reply: {
        id: String(btn.id).slice(0, 256),
        title: String(btn.title).slice(0, 20)
      }
    }));

    const interactivePayload = {
      type: "button",
      body: {
        text: bodyText
      },
      action: {
        buttons: formattedButtons
      }
    };

    if (headerText) {
      interactivePayload.header = {
        type: "text",
        text: headerText
      };
    }

    if (footerText) {
      interactivePayload.footer = {
        text: footerText
      };
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "interactive",
      interactive: interactivePayload
    };

    return this.executeSend(payload);
  }

  /**
   * Send an Interactive Call-To-Action URL Button Message
   * Renders a native button directly in WhatsApp that opens a link with 1 tap
   * 
   * @param {string} to WhatsApp phone number
   * @param {string} bodyText Main message body text
   * @param {string} buttonText Label on the button (max 20 chars, e.g. "▶️ Play Video")
   * @param {string} url The HTTPS URL to open
   * @param {string} [headerText] Optional header text
   * @param {string} [footerText] Optional footer text
   */
  async sendCtaUrlMessage(to, bodyText, buttonText, url, headerText = null, footerText = null) {
    if (!to || !bodyText || !buttonText || !url) {
      console.error("[WhatsApp Service] Missing parameters for CTA URL message.");
      return null;
    }

    const cleanTo = this.cleanPhone(to);
    const interactivePayload = {
      type: "cta_url",
      body: {
        text: bodyText
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: String(buttonText).slice(0, 20),
          url: url
        }
      }
    };

    if (headerText) {
      interactivePayload.header = {
        type: "text",
        text: headerText
      };
    }

    if (footerText) {
      interactivePayload.footer = {
        text: footerText
      };
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "interactive",
      interactive: interactivePayload
    };

    return this.executeSend(payload);
  }

  /**
   * Send an Interactive List Message (Up to 10 rows, ideal for 4+ choices)
   * 
   * @param {string} to WhatsApp phone number
   * @param {string} bodyText Main message text
   * @param {string} buttonTitle Title of the list action button (max 20 chars, e.g. "Select Profile")
   * @param {Array<{title: string, rows: Array<{id: string, title: string, description?: string}>}>} sections
   * @param {string} [headerText] Optional header text
   * @param {string} [footerText] Optional footer text
   */
  async sendListMessage(to, bodyText, buttonTitle = "Select Option", sections = [], headerText = null, footerText = null) {
    if (!to || !bodyText || !sections.length) {
      console.error("[WhatsApp Service] Missing parameters for list message.");
      return null;
    }

    const cleanTo = this.cleanPhone(to);

    // Format sections & rows adhering to Meta character limits
    const formattedSections = sections.map(sec => ({
      title: String(sec.title || "Options").slice(0, 24),
      rows: (sec.rows || []).slice(0, 10).map(r => ({
        id: String(r.id).slice(0, 200),
        title: String(r.title).slice(0, 24),
        description: r.description ? String(r.description).slice(0, 72) : undefined
      }))
    }));

    const interactivePayload = {
      type: "list",
      body: {
        text: bodyText
      },
      action: {
        button: String(buttonTitle).slice(0, 20),
        sections: formattedSections
      }
    };

    if (headerText) {
      interactivePayload.header = {
        type: "text",
        text: headerText
      };
    }

    if (footerText) {
      interactivePayload.footer = {
        text: footerText
      };
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "interactive",
      interactive: interactivePayload
    };

    return this.executeSend(payload);
  }

  /**
   * Send interactive message dynamically:
   * Uses Button Message if options <= 3, otherwise List Message (up to 10 options)
   */
  async sendInteractive(to, bodyText, options = [], buttonTitle = "Select Option", headerText = null, footerText = null) {
    if (options.length <= 3) {
      return this.sendButtonMessage(to, bodyText, options, headerText, footerText);
    } else {
      const sections = [
        {
          title: "Select an option",
          rows: options.map(opt => ({
            id: opt.id,
            title: opt.title,
            description: opt.description
          }))
        }
      ];
      return this.sendListMessage(to, bodyText, buttonTitle, sections, headerText, footerText);
    }
  }

  /**
   * Send a sequence of messages in order with a delay (e.g. 400ms) between them
   * This guarantees that multiple messages (like "Welcome..." then "Do you agree...")
   * arrive "each with next to next" in exact chronological order on WhatsApp.
   * 
   * @param {string} to WhatsApp phone number
   * @param {Array<object>} messages Array of message objects:
   *   { type: 'text', text: '...' }
   *   { type: 'button', body: '...', buttons: [...] }
   *   { type: 'list', body: '...', buttonTitle: '...', sections: [...] }
   *   { type: 'interactive', body: '...', options: [...] }
   */
  async sendMessageSequence(to, messages = []) {
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (i > 0) {
        const prevMsg = messages[i - 1];
        // When sending media (especially images), give Meta's crawler and CDN enough time (2500ms)
        // to download and display the media on the user's screen before the next text/button message arrives.
        let delay = 300;
        if (prevMsg && prevMsg.type === "image") {
          delay = 2500;
        } else if (prevMsg && (prevMsg.type === "video" || prevMsg.type === "audio")) {
          delay = 1200;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (msg.type === "text") {
        await this.sendTextMessage(to, msg.text);
      } else if (msg.type === "image") {
        await this.sendImageMessage(to, msg.url, msg.caption);
      } else if (msg.type === "video") {
        await this.sendVideoMessage(to, msg.url, msg.caption);
      } else if (msg.type === "audio") {
        await this.sendAudioMessage(to, msg.url);
      } else if (msg.type === "button") {
        await this.sendButtonMessage(to, msg.body, msg.buttons, msg.header, msg.footer);
      } else if (msg.type === "list") {
        await this.sendListMessage(to, msg.body, msg.buttonTitle || "Select Option", msg.sections, msg.header, msg.footer);
      } else if (msg.type === "interactive") {
        await this.sendInteractive(to, msg.body, msg.options, msg.buttonTitle, msg.header, msg.footer);
      } else if (msg.type === "cta_url") {
        await this.sendCtaUrlMessage(to, msg.body, msg.buttonText, msg.url, msg.header, msg.footer);
      }
    }
  }

  /**
   * Mark an incoming customer message as 'read'
   * 
   * @param {string} messageId Meta incoming message ID (wamid.XXX)
   */
  async markAsRead(messageId) {
    if (!messageId) return;

    const url = `${this.getBaseUrl()}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId
    };

    try {
      await axios.post(url, payload, {
        headers: this.getHeaders(),
        timeout: 10000
      });
    } catch (error) {
      // Non-critical, ignore
    }
  }

  /**
   * Send WhatsApp text message via Meta Cloud API
   * Alias method adhering to requirement 4
   * 
   * @param {string} to Recipient WhatsApp phone number
   * @param {string} message Text message body
   */
  async sendWhatsAppMessage(to, message) {
    return sendWhatsAppMessage(to, message);
  }
}

/**
 * Standalone reusable function for sending WhatsApp Cloud API messages
 * POST https://graph.facebook.com/v26.0/1441499925712464/messages
 * Reads token from process.env.WHATSAPP_ACCESS_TOKEN without hardcoding.
 * 
 * @param {string} to Recipient phone number
 * @param {string} message Text message body
 */
async function sendWhatsAppMessage(to, message) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1441499925712464";
  const apiVersion = process.env.GRAPH_API_VERSION || "v26.0";
  const cleanTo = String(to || "").replace(/\D/g, "");

  if (!token || token === "YOUR_SYSTEM_USER_ACCESS_TOKEN") {
    console.warn("[WhatsApp Service Warning] WHATSAPP_ACCESS_TOKEN is missing or not configured in .env!");
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: cleanTo,
    type: "text",
    text: {
      body: String(message || "")
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    });
    const msgId = response.data?.messages?.[0]?.id || "OK";
    console.log(`[WhatsApp Outbound Success] Sent message to ${cleanTo} (ID: ${msgId})`);
    return response.data;
  } catch (error) {
    const status = error.response ? error.response.status : "NETWORK_ERROR";
    const errorData = error.response?.data?.error || {};
    const errorMessage = errorData.message || error.message;
    console.error(`[WhatsApp API Error] Status: ${status} | Code: ${errorData.code || "N/A"} | Error: ${errorMessage}`);
    return null;
  }
}

const serviceInstance = new WhatsAppService();
serviceInstance.sendWhatsAppMessage = sendWhatsAppMessage;

module.exports = serviceInstance;
module.exports.sendWhatsAppMessage = sendWhatsAppMessage;
module.exports.WhatsAppService = WhatsAppService;

