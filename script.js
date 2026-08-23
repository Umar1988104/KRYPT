/* =========================================================================
   KRYPT — Scam & Phishing Detector (MVP)
   Smart India Hackathon 2026

   HOW THIS WORKS
   ---------------
   Pure client-side app (HTML/CSS/JS). No backend server, no database.
   The browser calls Google's Gemini API directly (free tier via Google AI
   Studio, no credit card needed), using the same "bring your own API key"
   pattern.

   The user's API key is entered once, stored only in this browser's
   localStorage, and sent straight to the AI provider — it never touches any
   server of ours. This is why there's no backend in this MVP.

   KNOWN LIMITATION (say this plainly if judges ask):
   Because the key lives in the browser, anyone with access to that browser's
   dev tools could read it. That's an accepted tradeoff for a demo/BYOK tool,
   not something you'd ship to end-users with a shared key. A production
   version would add a small backend to hide the key — see README roadmap.
   ========================================================================= */

const API_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.5-flash"; // free-tier model — check ai.google.dev for the current free model id

const SYSTEM_PROMPT = `You are a cybersecurity analyst specialising in phishing and scam
detection for Indian users. You will be given a piece of content: a URL, an SMS,
a WhatsApp message, or an email. It may be in English, Hindi, or Hinglish.

Watch especially for scam patterns common in India: fake UPI payment/refund links,
fake courier "pay to release parcel" messages, fake bank KYC-update or account-block
warnings, fake government scheme messages, "digital arrest" threats, fake job offers
asking for an upfront fee, lottery/prize scams, and urgency/fear-based language.

Respond with ONLY a valid JSON object (no markdown, no extra text) in this exact shape:
{
  "verdict": "Safe" | "Suspicious" | "Phishing",
  "confidence_percent": <integer 0-100>,
  "red_flags": ["<short red flag>", ...],
  "explanation": "<2-3 plain-language sentences explaining the verdict, understandable
      by someone who is not tech-savvy>"
}

If genuinely safe, red_flags can be an empty array. Be honest and calibrated with
confidence_percent — do not default to extremes.`;

const SAMPLES = {
  phish1:
    "Dear Customer, your SBI account will be BLOCKED within 24 hours due to incomplete KYC. Update immediately: http://sbi-kyc-update.in/verify",
  phish2:
    "Aapka parcel customs mein hold hai. 49 rupay pay karke release karwayein: bit.ly/parcel-release-49",
  safe1:
    "Hi, this is a reminder that your electricity bill for August is due on the 5th. You can pay it on the official portal or at any authorized centre.",
};

const VERDICT_STYLE = {
  Safe: { icon: "✅", color: "var(--safe)" },
  Suspicious: { icon: "⚠️", color: "var(--suspicious)" },
  Phishing: { icon: "🚨", color: "var(--danger)" },
  Error: { icon: "❌", color: "var(--text-dim)" },
};

// ---------- DOM refs ----------
const inputText = document.getElementById("inputText");
const analyzeBtn = document.getElementById("analyzeBtn");
const analyzeLabel = document.getElementById("analyzeLabel");
const statusMsg = document.getElementById("statusMsg");
const resultSection = document.getElementById("resultSection");
const verdictIcon = document.getElementById("verdictIcon");
const verdictText = document.getElementById("verdictText");
const confidenceText = document.getElementById("confidenceText");
const flagsList = document.getElementById("flagsList");
const explainText = document.getElementById("explainText");

const keyBtn = document.getElementById("keyBtn");
const keyModal = document.getElementById("keyModal");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const closeKeyBtn = document.getElementById("closeKeyBtn");

// ---------- API key handling ----------
function getApiKey() {
  return localStorage.getItem("krypt_api_key") || "";
}
function openKeyModal() {
  apiKeyInput.value = getApiKey();
  keyModal.classList.remove("hidden");
}
function closeKeyModal() {
  keyModal.classList.add("hidden");
}
keyBtn.addEventListener("click", openKeyModal);
closeKeyBtn.addEventListener("click", closeKeyModal);
saveKeyBtn.addEventListener("click", () => {
  localStorage.setItem("krypt_api_key", apiKeyInput.value.trim());
  closeKeyModal();
  statusMsg.textContent = "API key saved in this browser.";
});

// Prompt for key on first load if not set
window.addEventListener("DOMContentLoaded", () => {
  if (!getApiKey()) openKeyModal();
});

// ---------- Sample chips ----------
document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    inputText.value = SAMPLES[btn.dataset.sample];
  });
});

// ---------- Analyse ----------
analyzeBtn.addEventListener("click", analyse);

async function analyse() {
  const content = inputText.value.trim();
  if (!content) {
    statusMsg.textContent = "Paste a message or URL first.";
    return;
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    statusMsg.textContent = "Add your API key first (top right).";
    openKeyModal();
    return;
  }

  setLoading(true);
  resultSection.classList.add("hidden");
  statusMsg.textContent = "Analysing…";

  try {
    const result = await callAI(content, apiKey);
    renderResult(result);
    statusMsg.textContent = "";
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "Error: " + err.message;
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  analyzeLabel.textContent = isLoading ? "Analysing…" : "Analyse";
}

async function callAI(content, apiKey) {
  const url = `${API_URL_BASE}/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        { role: "user", parts: [{ text: `Analyse this content:\n\n${content}` }] },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return parseModelJson(text);
}

function parseModelJson(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return {
      verdict: "Error",
      confidence_percent: 0,
      red_flags: ["Could not parse the model's response."],
      explanation: cleaned.slice(0, 400),
    };
  }
}

// ---------- Render ----------
function renderResult(r) {
  const style = VERDICT_STYLE[r.verdict] || VERDICT_STYLE.Error;
  verdictIcon.textContent = style.icon;
  verdictText.textContent = r.verdict || "Unknown";
  verdictText.style.color = style.color;
  confidenceText.textContent = `${r.confidence_percent ?? 0}% confidence`;

  flagsList.innerHTML = "";
  const flags = r.red_flags || [];
  if (flags.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No red flags found.";
    flagsList.appendChild(li);
  } else {
    flags.forEach((f) => {
      const li = document.createElement("li");
      li.textContent = f;
      flagsList.appendChild(li);
    });
  }

  explainText.textContent = r.explanation || "-";
  resultSection.classList.remove("hidden");
}
