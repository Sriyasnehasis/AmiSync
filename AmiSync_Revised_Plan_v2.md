# AmiSync — Implementation Plan v2

> **v1 Scope (current focus):** Resume Optimizer + Mock Interview only.
> All other features (Job Matcher, Talent Connect, HR Discovery, Skill Gap, Portfolio Sync) are deferred to future phases.

---

## 1. What We're Building (v1)

### Module 1 — Resume Optimizer

**Goal:** Let any user (tech or non-tech) build, upload, or improve a resume and get a tailored match score against a job description.

**Features:**
- Upload existing resume → AI parses and structures it into editable sections
- Resume builder with 3–4 clean templates (general-purpose, creative/portfolio, conservative)
- Paste a job description → AI rewrites bullet points to mirror JD language + shows **JD Match Score** (not "ATS Score" — this label overstates what it is)
- Live split-screen preview so users see changes instantly

**AI:** Gemini API for parsing, rewriting, and JD keyword extraction. Structured JSON schema output — no paid parsing vendors.

**Done when:**
- A user can sign up, build or upload a resume, paste a JD, and receive a tailored match score and suggested edits
- Result is downloadable as PDF

---

### Module 2 — Mock Interview

**Goal:** Let any user practice realistic mock interviews with delivery feedback, not just content scoring.

**Features:**
- Role + industry selector as entry point → generates a tailored question set dynamically via Gemini (not a hardcoded bank — scales to any profession)
- Voice (Web Speech API) or text answer mode
- Per-answer feedback: content relevance, filler-word count, pacing (words/min)
- Session summary with named metrics: **Content Relevance / Clarity / Pacing** (not bare percentages)
- Session history log

**AI:** Gemini for question generation and answer evaluation. Filler-word and WPM analysis via post-processing on the transcript text — no ML model needed.

**Done when:**
- A user picks a role + industry, answers 5 questions, and gets a session summary with named, actionable feedback
- Works for both a CS student and a marketing professional without code changes

---

## 2. What We Are NOT Building in v1

| Feature | Reason deferred |
|---|---|
| Job Matcher / Job Board | Needs Adzuna API caching + rate-limit handling; not core to v1 |
| Talent Connect / HR Discovery | No scraping, manual-add flow needs design work |
| Skill Gap module | Depends on resume + JD both being live; defer until after Resume Optimizer ships |
| Portfolio / GitHub Sync | Optional for tech users; non-core for general audience |
| Chrome Extension | Separate surface, separate timeline |
| Live interview copilot/overlay | Out of scope — ethically problematic, increasingly banned |

> These are **not cancelled** — just not v1. Focus on making Resume + Interview excellent before expanding.

---

## 3. Tech Stack (v1)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind + Framer Motion | Already set up |
| Backend | FastAPI (Python 3.11) | Already set up |
| Database | Neon Postgres (free tier: 0.5GB, autosuspend ~1s wake) | Preferred over Render/Railway for no cold-start penalty |
| AI | Gemini API — `gemini-2.5-flash-lite` (primary) → `gemini-2.5-flash` (fallback on 429) | No OpenAI dependency |
| Auth | JWT (stateless) | Already implemented |
| Deployment | Vercel (Next.js + FastAPI Python runtime, single host) | Removes separate backend service, no 30–60s wake-up |

**AI fallback rule:** `flash-lite` → `flash` → queue + "try again shortly" message. Add a simple token-bucket rate limiter around outgoing Gemini calls so concurrent requests don't trip the RPM limit together.

---

## 4. Phased Roadmap

### Phase 0 — Stabilize (do this first)
- [ ] Migrate FastAPI to Vercel Python runtime (removes Render cold-start issue)
- [ ] Replace any fabricated/hardcoded data (fake dashboard stats, mock ticker) with real empty/zero states
- [ ] Update `ai_service.py` to use the Gemini fallback chain above
- [ ] Add proper error boundaries and loading states to all pages
- **Done when:** every route loads something real within 2–3s with no fake data visible

### Phase 1 — Resume Optimizer (current priority)
- [ ] Template gallery (3–4 templates with live split-screen preview)
- [ ] Resume upload + AI parsing → editable sections
- [ ] JD-paste → AI rewrite + JD Match Score
- [ ] PDF export
- **Done when:** a user can go from sign-up → polished resume + JD match score, end to end

### Phase 2 — Mock Interview (current priority)
- [ ] Role + industry picker → dynamic Gemini-generated question set
- [ ] Voice (Web Speech API) + text answer modes
- [ ] Per-answer: content feedback + filler-word count + WPM
- [ ] Session summary: Content Relevance / Clarity / Pacing (named metrics)
- [ ] Session history
- **Done when:** any user (tech or non-tech) can run a full 5-question session and get meaningful, labelled feedback

### Phase 3 — Deployment & Polish
- [ ] Deploy frontend + backend to Vercel
- [ ] Auth flow end-to-end (sign up → dashboard → features)
- [ ] Responsive design check across mobile, tablet, desktop
- [ ] Basic usage analytics (which modules people use — before investing in new ones)

### Phase 4+ — Future features (post-v1)
- Job Board + Adzuna caching
- Skill Gap (JD-driven, industry-agnostic)
- HR Discovery (manual contact-add + AI outreach drafts)
- Portfolio / GitHub Sync reframed as optional

---

## 5. Navigation & UI State (v1)

The app currently shows only two nav items — this is intentional:

| Nav Item | Route | Status |
|---|---|---|
| Resume Optimizer | `/resume` | In progress |
| Interview Prep | `/interviews` | In progress |

No other nav links should be visible or linked in v1. Any leftover references to Job Matcher, Talent Connect, or HR Discovery in the UI should be removed.

---

## 6. Brand & Copy Guidelines

- **Name everywhere:** AmiSync (never HireFlow, never CareerZene)
- **Logo:** Purple-teal "A" chevron icon (`/amisync-logo.png`)
- **Theme:** Violet `#5845FE` (accent), Mint-teal `#00D09C` (accent-2), Slate `#F8FAFC` bg (light), `#0B0F19` bg (dark)
- **Tone:** Confident, warm, approachable — not "elite" or intimidating
- **Labels:** Use "JD Match Score" not "ATS Score"; use named metric cards not bare percentages in interview feedback
