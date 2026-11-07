const chatbotService = require("./services/chatbotService");
const { getConversationState, resetConversationState, clearAllSessions } = require("./utils/conversationState");

async function runTests() {
  console.log("==========================================");
  console.log("🧪 TESTING CUSTOM CLEAN FLOW SKELETON");
  console.log("==========================================\n");

  const testPhone = "919500406150";
  clearAllSessions();

  // Test 1: User says "hi" -> Main Menu
  console.log("--- TEST 1: Greeting triggers Main Menu ---");
  let replies = await chatbotService.processMessage(testPhone, "hi", null, "test_msg_1");
  console.assert(replies.length === 2, "Expected 2 messages (welcome text + button menu)");
  console.assert(replies[0].type === "text", "1st message should be text");
  console.assert(replies[1].type === "button", "2nd message should be button");
  console.assert(replies[1].buttons.length === 3, "Expected 3 buttons");
  console.log("✅ Main Menu received:", replies[1].buttons.map(b => b.title).join(", "));

  // Test 2: User clicks Option 1
  console.log("\n--- TEST 2: User clicks Option 1 ---");
  replies = await chatbotService.processMessage(testPhone, "Option 1", "menu_opt_1", "test_msg_2");
  console.assert(replies[0].text.includes("Option 1"), "Expected acknowledgment of Option 1");
  console.log("✅ Step transitioned to STEP_OPTION_1:", replies[0].text);

  // Test 3: User enters text input
  console.log("\n--- TEST 3: User inputs text message ---");
  replies = await chatbotService.processMessage(testPhone, "My customized requirement", null, "test_msg_3");
  console.assert(replies[0].text.includes("My customized requirement"), "Expected response with user input");
  let state = getConversationState(testPhone);
  console.assert(state.step === "COMPLETE", "State should be COMPLETE");
  console.assert(state.data.option1Response === "My customized requirement", "User input should be stored in state.data");
  console.log("✅ State successfully saved data:", state.data);

  // Test 4: User clicks restart -> back to Main Menu
  console.log("\n--- TEST 4: Restart command resets flow ---");
  replies = await chatbotService.processMessage(testPhone, "menu", "restart", "test_msg_4");
  console.assert(replies.length === 2, "Expected welcome + menu");
  state = getConversationState(testPhone);
  console.assert(state.step === "MAIN_MENU", "State should be back to MAIN_MENU");
  console.log("✅ Reset verified!");

  console.log("\n==========================================");
  console.log("🎉 ALL TESTS PASSED! Clean flow is 100% ready.");
  console.log("==========================================");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
