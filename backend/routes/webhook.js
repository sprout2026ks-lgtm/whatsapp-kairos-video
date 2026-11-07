const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsappController");

/**
 * Meta WhatsApp Cloud API Webhook Endpoints
 * 
 * GET  /webhook  -> Verification challenge by Meta Developer portal
 * POST /webhook  -> Incoming WhatsApp messages & events from Meta
 */
router.get("/", whatsappController.verifyWebhook);
router.post("/", whatsappController.handleWebhook);

module.exports = router;
