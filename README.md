# AmiSync — AI-Powered Career Companion

AmiSync is an AI-powered platform that helps students and professionals prepare for job applications with confidence. The current focus is on two core features: **Resume Optimizer** and **Mock Interview**.

---

## 🚀 Current Features (v1 Scope)

### 📄 Resume Optimizer
- **AI Resume Builder**: Create professional, ATS-friendly resumes with clean templates.
- **JD Match Score**: Paste a job description and get a keyword match score with tailored suggestions.
- **Real-time Preview**: See formatting changes instantly as you edit.
- **Resume Parsing**: Upload an existing resume and let AI extract and structure your data.

### 🎤 Mock Interview
- **Role + Industry Picker**: Select your target job title and industry to get a tailored question set.
- **Voice & Text Practice**: Answer questions via voice or text — your choice.
- **Real-time Feedback**: Get instant analysis on content, clarity, and pacing after each answer.
- **Delivery Metrics**: Filler-word detection, words-per-minute, and named score cards (Content Relevance / Clarity / Pacing).

---

> **Note:** Job Matcher, Talent Connect, HR Discovery, Skill Gap, and Portfolio Sync are **not in scope for v1**. These may be considered in future phases once the core two features are stable and deployed.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python 3.11), SQLAlchemy, Pydantic |
| Database | PostgreSQL (Neon) |
| AI Engine | Gemini API (gemini-2.5-flash-lite → gemini-2.5-flash fallback) |
| Auth | JWT (stateless sessions) |
| Deployment | Vercel (frontend + FastAPI Python runtime) |

---

## 📂 Project Structure

```
AmiSync/
├── backend/            # FastAPI backend service
│   ├── app/
│   │   ├── api/        # Route handlers (auth, resume, interview)
│   │   ├── models/     # SQLAlchemy models
│   │   └── services/   # AI service (Gemini integration)
│   └── tests/
├── frontend/           # Next.js frontend
│   ├── app/
│   │   ├── resume/     # Resume Optimizer pages
│   │   └── interviews/ # Mock Interview pages
│   ├── src/
│   │   ├── components/ # Shared UI components
│   │   └── styles/     # Global CSS & theme
│   └── public/         # Static assets (logos, images)
├── docs/               # Project documentation
└── docker-compose.yml  # Local dev orchestration
```

---

## ⚡ Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or use Neon free tier)

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000
# API docs → http://localhost:8000/docs
```

### Environment Variables
```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Fill in: DATABASE_URL, GEMINI_API_KEY, JWT_SECRET
```

---

## 👤 Developer

**Sriyasnehasis** — [GitHub](https://github.com/Sriyasnehasis)

---

## 📄 License

MIT License
