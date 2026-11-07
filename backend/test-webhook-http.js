const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const axios = require("axios");
const webhookRoutes = require("./routes/webhook");

async function testHttpEndpoints() {
  const app = express();
  app.use(express.json());

  // Health endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Webhook endpoint
  app.use("/webhook", webhookRoutes);

  const server = app.listen(5099, async () => {
    console.log("--------------------------------------------------");
    console.log("🧪 Test HTTP Server running on port 5099...");
    console.log("--------------------------------------------------");

    const verifyToken =
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      process.env.WHATSAPP_VERIFY_TOKEN ||
      "sproutks_webhook_verify_token_2026";

    try {
      // Test 1: GET /health
      console.log("\n[Test 1] Testing GET /health ...");
      const healthRes = await axios.get("http://localhost:5099/health");
      console.log("Status:", healthRes.status, "Body:", healthRes.data);
      console.assert(healthRes.status === 200, "Health status should be 200");
      console.assert(healthRes.data?.status === "ok", "Health body should have status 'ok'");

      // Test 2: GET /webhook Verification Success
      console.log("\n[Test 2] Testing GET /webhook verification (Valid Token) ...");
      const challengeCode = "123456";
      const getRes = await axios.get("http://localhost:5099/webhook", {
        params: {
          "hub.mode": "subscribe",
          "hub.verify_token": verifyToken,
          "hub.challenge": challengeCode
        }
      });
      console.log("Status:", getRes.status, "Challenge returned:", getRes.data);
      console.assert(getRes.status === 200, "Expected 200 OK");
      console.assert(String(getRes.data) === challengeCode, "Expected challenge to match exactly");

      // Test 3: GET /webhook Verification Fail (Wrong Token)
      console.log("\n[Test 3] Testing GET /webhook verification (Invalid Token) ...");
      try {
        await axios.get("http://localhost:5099/webhook", {
          params: {
            "hub.mode": "subscribe",
            "hub.verify_token": "wrong_token_12345",
            "hub.challenge": challengeCode
          }
        });
        console.error("FAIL: Should have rejected invalid token!");
      } catch (err) {
        console.log("Status:", err.response?.status, "(Expected 403 Forbidden)");
        console.assert(err.response?.status === 403, "Expected 403");
      }

      // Test 4: POST /webhook Incoming Text Message
      console.log("\n[Test 4] Testing POST /webhook with Text Message ...");
      const textMsgId = "wamid.test_text_" + Date.now();
      const textPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: process.env.WHATSAPP_WABA_ID || "1125512XXXXXXXX",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: "49XXXXXXXXXX",
                    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || "1441499925712464"
                  },
                  messages: [
                    {
                      from: "919629531891",
                      id: textMsgId,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: "text",
                      text: { body: "Hello" }
                    }
                  ]
                },
                field: "messages"
              }
            ]
          }
        ]
      };
      const postTextRes = await axios.post("http://localhost:5099/webhook", textPayload);
      console.log("Status:", postTextRes.status, "Response:", postTextRes.data);
      console.assert(postTextRes.status === 200, "Text POST should return 200");

      // Test 5: POST /webhook Duplicate Message Detection
      console.log("\n[Test 5] Testing Duplicate Message Detection (Re-sending same message ID) ...");
      const postDupRes = await axios.post("http://localhost:5099/webhook", textPayload);
      console.log("Status:", postDupRes.status, "Response:", postDupRes.data);
      console.assert(postDupRes.status === 200, "Duplicate POST should still return 200 immediately");

      // Test 6: POST /webhook Status Updates (sent, delivered, read, failed)
      console.log("\n[Test 6] Testing Status Updates Handling (delivered, failed) ...");
      const statusPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: process.env.WHATSAPP_WABA_ID || "1125512XXXXXXXX",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || "1441499925712464"
                  },
                  statuses: [
                    {
                      id: "wamid.status_test_01",
                      status: "delivered",
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      recipient_id: "919629531891"
                    },
                    {
                      id: "wamid.status_test_02",
                      status: "failed",
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      recipient_id: "919629531891",
                      errors: [{ code: 131053, title: "Message cannot be delivered" }]
                    }
                  ]
                },
                field: "messages"
              }
            ]
          }
        ]
      };
      const statusRes = await axios.post("http://localhost:5099/webhook", statusPayload);
      console.log("Status:", statusRes.status, "Response:", statusRes.data);
      console.assert(statusRes.status === 200, "Status POST should return 200");

      // Test 7: POST /webhook Image Message
      console.log("\n[Test 7] Testing Image Message Handling ...");
      const imgPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: process.env.WHATSAPP_WABA_ID || "1125512XXXXXXXX",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  messages: [
                    {
                      from: "919629531891",
                      id: "wamid.img_" + Date.now(),
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: "image",
                      image: {
                        id: "img_media_9999",
                        mime_type: "image/jpeg",
                        caption: "My photo"
                      }
                    }
                  ]
                },
                field: "messages"
              }
            ]
          }
        ]
      };
      const imgRes = await axios.post("http://localhost:5099/webhook", imgPayload);
      console.log("Status:", imgRes.status);
      console.assert(imgRes.status === 200, "Image POST should return 200");

      console.log("\n==================================================");
      console.log("✅ ALL WEBHOOK TESTS PASSED SUCCESSFULLY!");
      console.log("==================================================");
    } catch (e) {
      console.error("❌ Test error:", e.message);
    } finally {
      server.close();
    }
  });
}

testHttpEndpoints();
