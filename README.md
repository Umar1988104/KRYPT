# KRYPT — AI-Powered Phishing & Scam Message Detector

**Smart India Hackathon 2026 | Software | Problem Statement: Real-Time AI/ML-Based Phishing Detection and Prevention System**

## Objective

Most phishing detectors only catch *known* malicious links via blacklists, and
almost none are built for the scam patterns actually hitting Indian users —
fake UPI requests, fake courier/KYC messages, "digital arrest" scams. KRYPT
lets a user paste a suspicious message or URL and get an instant, explained
verdict.

## Tech Stack (MVP)

- **Plain HTML, CSS, and JavaScript.** No frameworks, no build step, no backend
  server, no database.
- **AI reasoning:** Claude API (Anthropic), called directly from the browser
  using Anthropic's official "bring your own API key" browser-access mode.
  There is no custom-trained ML model — a carefully designed prompt does the
  analysis.

This stack was chosen deliberately to match the team's actual skillset
(HTML/CSS/JS) rather than force a backend language the team isn't confident
in. It's also the simplest possible thing to run: just open `index.html`.

## MVP Scope — What's Built vs. What's Roadmap

This is an MVP for a hackathon demo, not a production product. Kept it basic
on purpose:

**Built (working in this MVP):**
- [x] Paste any text (SMS / WhatsApp / email / URL) and get a verdict
- [x] Confidence score + specific red flags
- [x] Plain-language explanation
- [x] Detection tuned toward India-specific scam patterns (UPI, courier,
      fake KYC, digital arrest, etc.) built into the prompt
- [x] Quick example buttons for a reliable live demo

**Roadmap (planned next, not in this MVP — mention these in the pitch as
future work, don't claim they're built):**
- [ ] Full Hindi/Hinglish-tuned detection and a bilingual UI
- [ ] Screenshot upload (OCR/vision) — paste a screenshot instead of typing
- [ ] Toggle between a technical explanation and a simplified one for
      less tech-savvy users (e.g. elderly relatives)
- [ ] Small backend proxy so the API key isn't held client-side (see
      Security Note below)
- [ ] WhatsApp-based reporting bot
- [ ] Browser extension for real-time link scanning

## How It Works (architecture, for the judges' Q&A round)

```
User pastes text in the browser
        |
        v
JavaScript builds a request with a structured system prompt
(India-specific scam patterns + required JSON output format)
        |
        v
Direct fetch() call from the browser to Anthropic's Claude API
        |
        v
JSON response: verdict, confidence, red flags, explanation
        |
        v
Rendered on screen
```

## Security Note (be upfront about this if asked)

This MVP uses a "bring your own API key" pattern: each user pastes their own
Claude API key, which is stored only in their browser's `localStorage` and
sent directly to Anthropic — never to a server of ours, because we don't have
one in this MVP. The honest tradeoff: anyone with access to that browser's
dev tools could read the key. That's an accepted limitation for a demo/BYOK
tool, not something you'd ship broadly with a shared key. A production
version would add a small backend to keep the key server-side — listed above
as roadmap.

## Running It Locally

No installation needed.

1. Download/clone this folder.
2. Double-click `index.html` to open it in your browser (or right-click →
   Open With → your browser).
3. On first load it will ask for your Anthropic API key — get one free at
   [console.anthropic.com](https://console.anthropic.com), paste it in.
   It's saved in your browser for next time.
4. Paste a message and click **Analyse**.

## Deploying (for the demo video / live judging)

Use **GitHub Pages** — free, and it's the same repo you're already
submitting.

1. Push this folder to your GitHub repo (see Team Setup below).
2. In the repo: **Settings → Pages → Source → Deploy from a branch → main
   → / (root) → Save**.
3. GitHub gives you a live URL like
   `https://<username>.github.io/<repo-name>/` in a minute or two.
4. Open that URL, enter your API key once, and you have a public link to
   demo live or record your video against.

## Team Setup on GitHub (step by step)

1. One team member creates the repository on GitHub (keep it **private**
   during judging, per SIH rules) and pushes this project:
   ```
   git init
   git add .
   git commit -m "Initial MVP"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to the repo → **Settings → Collaborators and teams → Add people**.
3. Add each teammate by their **GitHub username** (not admission number —
   admission numbers are only needed later for the official SIH portal
   registration/team roster, not for GitHub).
4. Each teammate accepts the invite emailed to them, then can clone the repo:
   ```
   git clone https://github.com/<your-username>/<repo-name>.git
   ```

## Test Examples

See `test_examples.md` for a curated set of phishing/safe messages to
practice with before the live demo.

## Limitations

- Decision-support tool only — it flags and explains, the user still decides.
- Not a real-time email/SMS interceptor; user pastes content on demand.
- Tested against a small curated set (see `test_examples.md`), not a large
  benchmark — appropriate for an MVP, not a production accuracy claim.

## Team

Add your team name, team ID, and member names + admission numbers here
before SIH submission.
