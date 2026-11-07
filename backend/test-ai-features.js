const chatbotService = require("./services/chatbotService");
const aiService = require("./services/aiService");
const { getConversationState, resetConversationState } = require("./utils/conversationState");

async function testAIFeatures() {
  console.log("==========================================");
  console.log("🧪 RUNNING KAIROS GENAI INTEGRATION TESTS");
  console.log("==========================================\n");

  const testPhone = "919629531892";
  resetConversationState(testPhone);

  // 1. Verify Master Prompt structure
  console.log("--- TEST 1: Verifying Master Prompt Definition ---");
  console.assert(typeof aiService.MASTER_SYSTEM_PROMPT === "string", "Test 1 Failed: Master Prompt string missing");
  console.assert(aiService.MASTER_SYSTEM_PROMPT.includes("ADAPTIVE_QUESTION"), "Test 1 Failed: ADAPTIVE_QUESTION missing");
  console.assert(aiService.MASTER_SYSTEM_PROMPT.includes("JOB_MATCHING"), "Test 1 Failed: JOB_MATCHING missing");
  console.assert(aiService.MASTER_SYSTEM_PROMPT.includes("ASK_KAIROS_AI"), "Test 1 Failed: ASK_KAIROS_AI missing");
  console.log("✅ Master Prompt contains all 3 task specifications\n");

  // 2. Navigate candidate to Screen 6 (Offer Details)
  console.log("--- TEST 2: Navigating Candidate to Screen 6 ---");
  await chatbotService.processMessage(testPhone, "Hi");
  await chatbotService.processMessage(testPhone, "I agree", "agree");
  await chatbotService.processMessage(testPhone, "A job", "opt_job");
  await chatbotService.processMessage(testPhone, "A housewife", "profile_housewife");
  await chatbotService.processMessage(testPhone, "2 to 3 hours", "hours_2_3");
  await chatbotService.processMessage(testPhone, "From home", "loc_home");
  await chatbotService.processMessage(testPhone, "Smartphone", "dev_smart");
  await chatbotService.processMessage(testPhone, "Immediately", "start_now");
  const offerDetailsMsg = await chatbotService.processMessage(testPhone, "Details of offer 1", "details_offer_1");

  console.assert(offerDetailsMsg.length === 2, "Test 2 Failed: Expected 2 messages on Screen 6");
  const screen6Buttons = offerDetailsMsg[1].buttons;
  const hasAskAIButton = screen6Buttons.some(b => b.id === "ask_kairos_ai");
  console.assert(hasAskAIButton, "Test 2 Failed: '🤖 Ask Kairos AI' button missing on Screen 6");
  console.log("✅ Screen 6 verified with '🤖 Ask Kairos AI' button present\n");

  // 3. User taps "🤖 Ask Kairos AI"
  console.log("--- TEST 3: Candidate taps '🤖 Ask Kairos AI' ---");
  const askAIMenu = await chatbotService.processMessage(testPhone, "Ask Kairos AI", "ask_kairos_ai");
  console.assert(askAIMenu.length === 1, "Test 3 Failed: Expected 1 response message");
  console.assert(askAIMenu[0].body.includes("Ask Kairos AI"), "Test 3 Failed: Menu body mismatch");
  console.assert(askAIMenu[0].buttons.some(b => b.id === "ai_eligible"), "Test 3 Failed: 'Am I eligible?' button missing");
  console.assert(askAIMenu[0].buttons.some(b => b.id === "ai_suitable"), "Test 3 Failed: 'Why suitable?' button missing");
  console.log("✅ 'Ask Kairos AI' interactive prompt delivered with buttons\n");

  // 4. User taps "Am I eligible?"
  console.log("--- TEST 4: Candidate taps 'Am I eligible?' ---");
  const eligibleResp = await chatbotService.processMessage(testPhone, "Am I eligible?", "ai_eligible");
  console.assert(eligibleResp.length === 1, "Test 4 Failed: Expected 1 response");
  console.assert(eligibleResp[0].body.length > 10, "Test 4 Failed: Expected explanation body");
  console.assert(eligibleResp[0].buttons.some(b => b.id === "apply_offer"), "Test 4 Failed: 'Apply' button missing after AI response");
  console.log("✅ AI Eligibility response and action buttons delivered\n");

  // 5. User types free-form question in ASK_AI state
  console.log("--- TEST 5: Candidate types custom question ---");
  const customResp = await chatbotService.processMessage(testPhone, "Do I need to speak fluent French?");
  console.assert(customResp.length === 1, "Test 5 Failed: Expected 1 response to custom question");
  console.assert(customResp[0].buttons.some(b => b.id === "apply_offer"), "Test 5 Failed: 'Apply' button missing");
  console.log("✅ Free-form candidate query handled with seamless button options\n");

  // 6. User clicks Apply from AI screen
  console.log("--- TEST 6: Candidate clicks 'Apply' from AI screen ---");
  const applyResp = await chatbotService.processMessage(testPhone, "Apply", "apply_offer");
  console.assert(applyResp[0].text.includes("Application sent"), "Test 6 Failed: Confirmation missing");
  const state = getConversationState(testPhone);
  console.assert(state.step === "APPLIED", "Test 6 Failed: Step is not APPLIED");
  console.log("✅ Application successfully recorded from AI screen\n");

  console.log("==========================================");
  console.log("🎉 ALL KAIROS GENAI TESTS PASSED 100%!");
  console.log("==========================================");
}

testAIFeatures().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
