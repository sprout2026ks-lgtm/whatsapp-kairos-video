const axios = require("axios");

/**
 * Kairos AI Master Prompt
 */
const MASTER_SYSTEM_PROMPT = `You are "Kairos AI Engine", the intelligent backend for the Kairos WhatsApp chatbot.
You handle 3 tasks behind a button-based UI:
1. ADAPTIVE_QUESTION: Generate the most relevant next assessment question based on candidate answers.
2. JOB_MATCHING: Rank the top 3 jobs and write personalized match reasons for the candidate.
3. ASK_KAIROS_AI: Answer questions about a job (eligibility, fit, earnings) in under 50 words.

MANDATORY WHATSAPP CONSTRAINTS:
- Buttons: Exactly 2 or 3 buttons (Max 3).
- Button Title: MUST be 20 characters or fewer (Strict Meta/WATI rule).
- Text Formatting: Use WhatsApp markdown (*bold*, _italic_). Keep messages concise for mobile.
- Output Format: Return ONLY raw, valid JSON matching the schema below. No markdown backticks, no conversation.

UNIFIED JSON SCHEMA:
{
  "taskType": "ADAPTIVE_QUESTION | JOB_MATCHING | ASK_KAIROS_AI",
  "messageText": "Text body to display in WhatsApp",
  "buttons": [
    { "id": "btn_1", "title": "Max 20 chars" },
    { "id": "btn_2", "title": "Max 20 chars" },
    { "id": "btn_3", "title": "Max 20 chars" }
  ]
}

TASK RULES:
1. If TASK_TYPE == "ADAPTIVE_QUESTION":
   - "messageText": "*Question {X}/4*\\n[Targeted question relevant to candidate's background]"
   - "buttons": 2 or 3 concise options reflecting the answer choices.

2. If TASK_TYPE == "JOB_MATCHING":
   - "messageText": An intro line + Top 3 jobs from the catalog formatted as:
     *1. {Job Title}*\\n{Location} · {Hours}\\n💡 _Why you:_ {1-sentence match reason}\\n\\n[Repeat for Job 2 & 3]
   - "buttons": [{ "id": "details_offer_1", "title": "Details Offer 1" }, { "id": "details_offer_2", "title": "Details Offer 2" }, { "id": "see_more_offers", "title": "See more offers" }]

3. If TASK_TYPE == "ASK_KAIROS_AI":
   - "messageText": Friendly, direct, encouraging answer to userQuery (2-3 sentences max).
   - "buttons": [{ "id": "apply_offer", "title": "✅ Apply Now" }, { "id": "ask_another", "title": "Ask Kairos AI" }, { "id": "back_to_offers", "title": "⬅️ Back to offers" }]
`;

/**
 * Clean & enforce WhatsApp limits on LLM output
 */
function sanitizeAIOutput(parsed, defaultTaskType) {
  if (!parsed || typeof parsed !== "object") return null;

  const taskType = parsed.taskType || defaultTaskType;
  const messageText = String(parsed.messageText || "").trim();

  let buttons = Array.isArray(parsed.buttons) ? parsed.buttons : [];
  // Ensure between 1 and 3 buttons
  buttons = buttons.slice(0, 3).map((b, idx) => ({
    id: String(b.id || `btn_${idx + 1}`),
    title: String(b.title || `Option ${idx + 1}`).trim().slice(0, 20)
  }));

  if (!messageText || buttons.length === 0) {
    return null;
  }

  return {
    taskType,
    messageText,
    buttons
  };
}

/**
 * Execute LLM call using configured provider (Gemini, OpenRouter, or OpenAI)
 */
async function callLLM(userPrompt) {
  const isEnabled = process.env.AI_ENABLED === "true";
  if (!isEnabled) {
    return null;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const timeoutMs = 3500; // Fast timeout for responsive WhatsApp chat

  // 1. Google Gemini (Native API)
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${MASTER_SYSTEM_PROMPT}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4
        }
      };

      const resp = await axios.post(url, payload, { timeout: timeoutMs });
      const rawText = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return JSON.parse(rawText.trim());
      }
    } catch (err) {
      console.warn("[AI Engine: Gemini Error]", err.response?.data || err.message);
    }
  }

  // 2. OpenRouter (OpenAI-compatible)
  if (openRouterKey) {
    try {
      const resp = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: process.env.AI_MODEL || "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: MASTER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.4
        },
        {
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json"
          },
          timeout: timeoutMs
        }
      );

      const rawText = resp.data?.choices?.[0]?.message?.content;
      if (rawText) {
        const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } catch (err) {
      console.warn("[AI Engine: OpenRouter Error]", err.response?.data || err.message);
    }
  }

  // 3. OpenAI (Native API)
  if (openAiKey) {
    try {
      const resp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: process.env.AI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: MASTER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.4
        },
        {
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            "Content-Type": "application/json"
          },
          timeout: timeoutMs
        }
      );

      const rawText = resp.data?.choices?.[0]?.message?.content;
      if (rawText) {
        const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } catch (err) {
      console.warn("[AI Engine: OpenAI Error]", err.response?.data || err.message);
    }
  }

  return null;
}

/**
 * Task 1: Generate Adaptive Assessment Question
 */
async function getAdaptiveQuestion(candidateData, currentStepNumber) {
  const userPrompt = `
[INPUT CONTEXT]
TASK_TYPE: ADAPTIVE_QUESTION

Candidate Profile:
- Looking For: ${candidateData.lookingFor || "A job"}
- Profile: ${candidateData.profile || "Not specified"}
- Availability: ${candidateData.hours || "Not specified"}
- Location Preference: ${candidateData.workLocation || "Not specified"}
- Device: ${candidateData.device || "Not specified"}
- Start Date: ${candidateData.startDate || "Not specified"}
- Other Answers: ${JSON.stringify(candidateData)}

Current Question Step (Only for ADAPTIVE_QUESTION): ${currentStepNumber} of 4
Job Catalog (Only for JOB_MATCHING): N/A
Selected Job Details (Only for ASK_KAIROS_AI): N/A
User Query (Only for ASK_KAIROS_AI): N/A
`;

  const rawResult = await callLLM(userPrompt);
  return sanitizeAIOutput(rawResult, "ADAPTIVE_QUESTION");
}

/**
 * Task 2: Personalized Job Matching
 */
async function getPersonalizedJobMatching(candidateData, jobCatalog) {
  const userPrompt = `
[INPUT CONTEXT]
TASK_TYPE: JOB_MATCHING

Candidate Profile:
- Looking For: ${candidateData.lookingFor || "A job"}
- Profile: ${candidateData.profile || "Not specified"}
- Availability: ${candidateData.hours || "Not specified"}
- Location Preference: ${candidateData.workLocation || "Not specified"}
- Device: ${candidateData.device || "Not specified"}
- Start Date: ${candidateData.startDate || "Not specified"}
- Other Answers: ${JSON.stringify(candidateData)}

Current Question Step (Only for ADAPTIVE_QUESTION): N/A
Job Catalog (Only for JOB_MATCHING):
${JSON.stringify(jobCatalog, null, 2)}

Selected Job Details (Only for ASK_KAIROS_AI): N/A
User Query (Only for ASK_KAIROS_AI): N/A
`;

  const rawResult = await callLLM(userPrompt);
  return sanitizeAIOutput(rawResult, "JOB_MATCHING");
}

/**
 * Task 3: Ask Kairos AI (Q&A & Eligibility)
 */
async function askKairosAI(candidateData, selectedJob, userQuery) {
  const userPrompt = `
[INPUT CONTEXT]
TASK_TYPE: ASK_KAIROS_AI

Candidate Profile:
- Looking For: ${candidateData.lookingFor || "A job"}
- Profile: ${candidateData.profile || "Not specified"}
- Availability: ${candidateData.hours || "Not specified"}
- Location Preference: ${candidateData.workLocation || "Not specified"}
- Device: ${candidateData.device || "Not specified"}
- Start Date: ${candidateData.startDate || "Not specified"}
- Other Answers: ${JSON.stringify(candidateData)}

Current Question Step (Only for ADAPTIVE_QUESTION): N/A
Job Catalog (Only for JOB_MATCHING): N/A

Selected Job Details (Only for ASK_KAIROS_AI):
${JSON.stringify(selectedJob, null, 2)}

User Query (Only for ASK_KAIROS_AI): ${userQuery || "Am I eligible and why is this job suitable for me?"}
`;

  const rawResult = await callLLM(userPrompt);
  return sanitizeAIOutput(rawResult, "ASK_KAIROS_AI");
}

module.exports = {
  MASTER_SYSTEM_PROMPT,
  getAdaptiveQuestion,
  getPersonalizedJobMatching,
  askKairosAI
};
