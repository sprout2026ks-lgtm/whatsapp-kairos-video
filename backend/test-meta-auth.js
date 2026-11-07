const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const axios = require("axios");

async function checkMetaSetup() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.GRAPH_API_VERSION || "v26.0";

  console.log("Checking Meta Graph API Credentials...");
  console.log("Phone Number ID:", phoneId);
  console.log("Graph API Version:", version);
  console.log("Token length:", token ? token.length : 0);

  try {
    // 1. Verify Phone Number details from Meta Graph API
    const res = await axios.get(`https://graph.facebook.com/${version}/${phoneId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("\n✅ META GRAPH API CONNECTION SUCCESSFUL!");
    console.log("Verified Display Name:", res.data.verified_name);
    console.log("Display Phone Number:", res.data.display_phone_number);
    console.log("Quality Rating:", res.data.quality_rating);
    console.log("Code Verification Status:", res.data.code_verification_status);
  } catch (err) {
    console.error("\n❌ META API ERROR:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Error Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

checkMetaSetup();
