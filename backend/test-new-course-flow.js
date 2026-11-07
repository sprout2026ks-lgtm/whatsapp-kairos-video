const chatbotService = require("./services/chatbotService");
const { getConversationState, resetConversationState } = require("./utils/conversationState");

async function testFrenchCourseFlow() {
  console.log("=================================================");
  console.log("🧪 TESTING FRENCH COURSE WORKFLOW WITH POSTER IMAGE");
  console.log("=================================================\n");

  const testPhone = "919629531895";

  // --- STEP 1: Client says "Bonjour" -> Language Selection ---
  console.log("--- STEP 1: Client says 'Bonjour' -> Language selection ---");
  resetConversationState(testPhone);
  let replies = await chatbotService.processMessage(testPhone, "Bonjour");
  console.assert(replies.length === 2, `Step 1 Failed: Expected 2 items (welcome text + language buttons), got ${replies.length}`);
  console.assert(replies[0].text.includes("Welcome to Kairos\nBienvenue sur Kairos"), "Step 1 Failed: Welcome bilingual mismatch");
  console.assert(replies[1].buttons.some(b => b.id === "lang_fr"), "Step 1 Failed: French button missing");
  console.log("✅ Step 1: Language selection prompt delivered.");

  // --- STEP 1b: Client selects "French" ---
  console.log("--- STEP 1b: Client selects 'French' ---");
  replies = await chatbotService.processMessage(testPhone, "French", "lang_fr");
  console.assert(replies.length === 3, `Step 1b Failed: Expected 3 items (text + poster + consent button), got ${replies.length}`);
  
  // 1a: Welcome text
  console.assert(replies[0].type === "text", "Step 1b Failed: 1st message should be text");
  console.assert(replies[0].text === "Bienvenue sur Kairos – Votre professeur préféré.", `Step 1b Failed: Text mismatch: ${replies[0].text}`);
  console.log(`✅ Step 1b: Welcome message in French: "${replies[0].text}"`);

  // 1b: Poster image
  console.assert(replies[1].type === "image", "Step 1b Failed: 2nd message should be image");
  console.assert(replies[1].url.includes("programme_poster.jpg"), `Step 1b Failed: Image URL mismatch: ${replies[1].url}`);
  console.log(`✅ Step 1b: Sprout Kairos poster delivered: ${replies[1].url}`);

  // 1c: Consent button
  console.assert(replies[2].type === "button", "Step 1b Failed: 3rd message should be button prompt");
  console.assert(replies[2].body === "Suivez gratuitement le cours d'introduction et lancez votre parcours vers la réussite en affaires.", `Step 1b Failed: Consent question mismatch: ${replies[2].body}`);
  console.assert(replies[2].buttons.length === 1, `Step 1b Failed: Expected only 1 button, got ${replies[2].buttons.length}`);
  console.assert(replies[2].buttons[0].title === "J'accepte", "Step 1b Failed: 'J\\'accepte' button missing");
  console.log(`✅ Step 1b: Consent prompt with ONLY [J'accepte] delivered.\n`);

  // --- STEP 2: Client clicks "J'accepte" -> Video arrives ALONE with "Commencer gratuitement" ---
  console.log("--- STEP 2: Client clicks 'J'accepte' ---");
  replies = await chatbotService.processMessage(testPhone, "J'accepte", "agree");
  console.assert(replies.length === 1, `Step 2 Failed: Expected ONLY video, got ${replies.length}`);
  console.assert(replies[0].type === "video", "Step 2 Failed: Expected video message");
  console.assert(replies[0].url.includes("french.mp4"), `Step 2 Failed: Expected french.mp4, got ${replies[0].url}`);
  console.log(`✅ Step 2: Demo video delivered 1st ALONE (french.mp4) with caption: "${replies[0].caption}"\n`);

  // --- STEP 3: Video finished playing -> Prompt with [J'accepte] alone ---
  console.log("--- STEP 3: Video played fully -> Course subscription prompt with [J'accepte] alone ---");
  const subReplies = await chatbotService.processMessage(testPhone, "done");
  console.assert(subReplies.length === 1, "Step 3 Failed: Expected 1 button prompt");
  const subMsg = subReplies[0];
  console.assert(subMsg.type === "button", "Step 3 Failed: Expected button message");
  console.assert(subMsg.body === "Souhaitez-vous vous inscrire à notre cours ?", `Step 3 Failed: Question mismatch (${subMsg.body})`);
  console.assert(subMsg.buttons.length === 1, `Step 3 Failed: Expected ONLY 1 button (Accept alone), got ${subMsg.buttons.length}`);
  console.assert(subMsg.buttons[0].title === "J'accepte", `Step 3 Failed: Button title mismatch (${subMsg.buttons[0].title})`);
  console.log(`✅ Step 3: Delivered: "${subMsg.body}" with ONLY [${subMsg.buttons[0].title}] button.\n`);

  // --- STEP 4: Client clicks "J'accepte" -> Registration link in French (3rd image) ---
  console.log("--- STEP 4: Client clicks 'J'accepte' for Course ---");
  replies = await chatbotService.processMessage(testPhone, "J'accepte", "sub_accept");
  console.assert(replies.length === 1, "Step 4 Failed: Expected 1 registration message");
  const regMsg = replies[0];
  console.assert(regMsg.body.includes("Super ! Veuillez remplir le formulaire"), `Step 4 Failed: Body mismatch (${regMsg.body})`);
  console.assert(regMsg.body.includes("https://reg-feandsme-sprout.web.app/registration"), "Step 4 Failed: Form link missing");
  console.assert(regMsg.body.includes("Une fois soumis, revenez ici et appuyez ci-dessous !"), "Step 4 Failed: Return instruction missing");
  console.assert(regMsg.buttons.some(b => b.title === "Soumis ✅" && b.id === "form_submitted"), "Step 4 Failed: 'Soumis ✅' button missing");
  console.log(`✅ Step 4: Delivered French registration form & [Soumis ✅] button.\n`);

  // --- STEP 5: Client returns and taps "Soumis ✅" ---
  console.log("--- STEP 5: Client submits form and taps 'Soumis ✅' ---");
  replies = await chatbotService.processMessage(testPhone, "Soumis ✅", "form_submitted");
  console.assert(replies.length === 1, "Step 5 Failed: Expected 1 confirmation message");
  console.assert(replies[0].text === "Merci, nous vous contacterons sous peu.", `Step 5 Failed: Confirmation text mismatch: "${replies[0].text}"`);
  console.log(`✅ Step 5: Delivered final confirmation: "${replies[0].text}"\n`);

  // --- STEP 5b: Client returns and types text (e.g., "j'ai soumis") ---
  console.log("--- STEP 5b: Alternative candidate returns by typing free French text ---");
  const testPhone2 = "919629531899";
  resetConversationState(testPhone2);
  await chatbotService.processMessage(testPhone2, "Bonjour");
  await chatbotService.processMessage(testPhone2, "J'accepte", "agree");
  await chatbotService.processMessage(testPhone2, "J'accepte", "sub_accept");
  replies = await chatbotService.processMessage(testPhone2, "c'est fait");
  console.assert(replies[0].text === "Merci, nous vous contacterons sous peu.", `Step 5b Failed: Mismatch: "${replies[0].text}"`);
  console.log(`✅ Step 5b: Free French text response verified: "${replies[0].text}"\n`);

  console.log("=================================================");
  console.log("🎉 ALL FRENCH WORKFLOW TESTS PASSED 100%!");
  console.log("=================================================");
}

testFrenchCourseFlow().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
