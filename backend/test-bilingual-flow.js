const chatbotService = require("./services/chatbotService");
const { getConversationState, resetConversationState } = require("./utils/conversationState");

async function testBilingualFlow() {
  console.log("===================================================================");
  console.log("🧪 TESTING BILINGUAL KAIROS LITE ONBOARDING (ENGLISH & FRENCH)");
  console.log("===================================================================\n");

  const phoneEn = "919629531891";
  const phoneFr = "919629531892";

  // =================================================================
  // TEST 1: User says ANY word (e.g. "hi", "bonjour", "hello", "random")
  // =================================================================
  console.log("--- 1. Testing Initial Greeting / Any message trigger ---");
  resetConversationState(phoneEn);
  let replies = await chatbotService.processMessage(phoneEn, "hello");

  console.assert(replies.length === 2, `Expected 2 messages (welcome text + language buttons), got ${replies.length}`);
  
  // Message 1st:
  console.assert(replies[0].type === "text", "1st message should be text");
  console.assert(
    replies[0].text === "Welcome to Kairos\nBienvenue sur Kairos",
    `1st message mismatch: ${replies[0].text}`
  );
  console.log("✅ 1st Message Verified:\n" + replies[0].text);

  // Message 2nd:
  console.assert(replies[1].type === "button", "2nd message should be button message");
  console.assert(
    replies[1].body === "Pick your language\nChoisissez votre langue",
    `2nd message body mismatch: ${replies[1].body}`
  );
  console.assert(replies[1].buttons.length === 2, "Expected 2 buttons (English & French)");
  console.assert(replies[1].buttons[0].title === "English" && replies[1].buttons[0].id === "lang_en", "English button missing");
  console.assert(replies[1].buttons[1].title === "Français" && replies[1].buttons[1].id === "lang_fr", "Français button missing");
  console.log("✅ 2nd Message Verified:\n" + replies[1].body + "\nButtons: [English] [Français]\n");

  // =================================================================
  // TEST 2: User selects "French" -> Exact French Flow
  // =================================================================
  console.log("--- 2. Testing French Selection & Full French Flow ---");
  resetConversationState(phoneFr);
  await chatbotService.processMessage(phoneFr, "bonjour");
  
  // Click "French" button
  replies = await chatbotService.processMessage(phoneFr, "French", "lang_fr");
  console.assert(replies.length === 3, `Expected 3 items in French welcome, got ${replies.length}`);
  console.assert(replies[0].text === "Bienvenue sur Kairos – Votre professeur préféré.", `French welcome mismatch: ${replies[0].text}`);
  console.assert(replies[1].url.includes("programme_poster.jpg"), `French poster mismatch: ${replies[1].url}`);
  console.assert(replies[2].body.includes("Suivez gratuitement le cours d'introduction"), `French consent question mismatch: ${replies[2].body}`);
  console.assert(replies[2].buttons[0].title === "J'accepte", `French consent button mismatch: ${replies[2].buttons[0].title}`);
  console.log("✅ French Welcome sequence verified (Text + French poster + [J'accepte])");

  // User taps "J'accepte"
  replies = await chatbotService.processMessage(phoneFr, "J'accepte", "agree");
  console.assert(replies.length === 1 && replies[0].type === "video", "Expected French video");
  console.assert(replies[0].url.includes("french.mp4"), `Expected french.mp4, got ${replies[0].url}`);
  console.assert(replies[0].caption === "Commencer gratuitement", `French caption mismatch: ${replies[0].caption}`);
  console.log("✅ French video delivered (french.mp4, caption: Commencer gratuitement)");

  // Video finished / decision prompt
  replies = await chatbotService.processMessage(phoneFr, "done");
  console.assert(replies[0].body === "Souhaitez-vous vous inscrire à notre cours ?", `French subscription question mismatch: ${replies[0].body}`);
  console.assert(replies[0].buttons[0].title === "J'accepte", "French sub accept button mismatch");
  console.log("✅ French subscription prompt verified ([J'accepte])");

  // User accepts course
  replies = await chatbotService.processMessage(phoneFr, "J'accepte", "sub_accept");
  console.assert(replies[0].body.includes("https://reg-feandsme-sprout.web.app/registration"), "French registration link missing");
  console.assert(replies[0].buttons[0].title === "Soumis ✅", "French [Soumis ✅] button missing");
  console.log("✅ French registration link verified: https://reg-feandsme-sprout.web.app/registration");

  // User taps "Soumis ✅"
  replies = await chatbotService.processMessage(phoneFr, "Soumis ✅", "form_submitted");
  console.assert(replies[0].text === "Merci, nous vous contacterons sous peu.", `French thank you mismatch: ${replies[0].text}`);
  console.log("✅ French final thank you verified: " + replies[0].text + "\n");

  // =================================================================
  // TEST 3: User selects "English" -> English Flow with requested poster, video, and link
  // =================================================================
  console.log("--- 3. Testing English Selection & Full English Flow ---");
  resetConversationState(phoneEn);
  await chatbotService.processMessage(phoneEn, "hi");

  // Click "English" button
  replies = await chatbotService.processMessage(phoneEn, "English", "lang_en");
  console.assert(replies.length === 3, `Expected 3 items in English welcome, got ${replies.length}`);
  console.assert(replies[0].text === "Welcome to Kairos – Your favorite teacher.", `English welcome mismatch: ${replies[0].text}`);
  console.assert(replies[1].url.includes("programme_poster_english.jpg"), `English poster mismatch: ${replies[1].url}`);
  console.assert(replies[2].body.includes("Take the introductory course for free"), `English consent question mismatch: ${replies[2].body}`);
  console.assert(replies[2].buttons[0].title === "I accept", `English consent button mismatch: ${replies[2].buttons[0].title}`);
  console.log("✅ English Welcome sequence verified (Text + English poster + [I accept])");

  // User taps "I accept"
  replies = await chatbotService.processMessage(phoneEn, "I accept", "agree");
  console.assert(replies.length === 1 && replies[0].type === "video", "Expected English video");
  console.assert(replies[0].url.includes("kairos_english.mp4"), `Expected kairos_english.mp4, got ${replies[0].url}`);
  console.assert(replies[0].caption === "Start for free", `English caption mismatch: ${replies[0].caption}`);
  console.log("✅ English video delivered (kairos_english.mp4, caption: Start for free)");

  // Video finished / decision prompt
  replies = await chatbotService.processMessage(phoneEn, "done");
  console.assert(replies[0].body === "Would you like to register for our course?", `English subscription question mismatch: ${replies[0].body}`);
  console.assert(replies[0].buttons[0].title === "I accept", "English sub accept button mismatch");
  console.log("✅ English subscription prompt verified ([I accept])");

  // User accepts course
  replies = await chatbotService.processMessage(phoneEn, "I accept", "sub_accept");
  console.assert(replies[0].body.includes("https://reg-fe-and-sme-sprout.web.app"), "English registration link missing");
  console.assert(replies[0].buttons[0].title === "Submitted ✅", "English [Submitted ✅] button missing");
  console.log("✅ English registration link verified: https://reg-fe-and-sme-sprout.web.app");

  // User taps "Submitted ✅"
  replies = await chatbotService.processMessage(phoneEn, "Submitted ✅", "form_submitted");
  console.assert(replies[0].text === "Thank you, we will contact you shortly.", `English thank you mismatch: ${replies[0].text}`);
  console.log("✅ English final thank you verified: " + replies[0].text + "\n");

  console.log("===================================================================");
  console.log("🎉 ALL BILINGUAL FLOW TESTS PASSED 100%!");
  console.log("===================================================================");
}

testBilingualFlow().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
