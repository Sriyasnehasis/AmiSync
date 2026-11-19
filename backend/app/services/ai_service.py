"""
AmiSync AI Service — Multi-Provider AI Engine

Provider chain (all FREE, no credit card needed):
  1. Google Gemini (primary)      — gemini-2.5-flash-lite, ~1500 req/day
  2. Groq (secondary)             — llama-4-scout-17b, 14,400 req/day, sub-100ms
  3. OpenRouter (tertiary)        — free models (google/gemma-3-27b-it:free etc.)
  4. Rule-based fallback          — always works, no API needed

All AI features (ATS scoring, resume writing, cover letters, skill gap,
interview feedback) route through this unified _call_ai() function.
"""

import os
import re
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

# ─── 1. Gemini Setup ──────────────────────────────────────────────────────────
_GEMINI_MODELS = [
    "gemini-2.5-flash-lite",   # Primary: best daily quota on free tier
    "gemini-2.5-flash",        # Fallback: stronger reasoning
    "gemini-2.0-flash",        # Stable fallback
]

GEMINI_AVAILABLE = False
try:
    import google.generativeai as genai
    _gemini_key = os.getenv("GEMINI_API_KEY", "")
    if _gemini_key:
        genai.configure(api_key=_gemini_key)
        GEMINI_AVAILABLE = True
        logger.info("✅ Gemini API configured")
    else:
        logger.warning("⚠️  GEMINI_API_KEY not set")
except ImportError:
    logger.warning("⚠️  google-generativeai not installed")

# ─── 2. Groq Setup ────────────────────────────────────────────────────────────
# Sign up FREE at https://console.groq.com — no credit card needed
# Free limits: llama-4-scout → 1000 RPD | llama-3.1-8b → 14,400 RPD
_GROQ_MODELS = [
    "llama-4-scout-17b-16e-instruct",  # Best quality on free tier
    "llama-3.3-70b-versatile",          # Strong reasoning, 1000 RPD
    "llama-3.1-8b-instant",             # Fastest, 14,400 RPD
]

GROQ_AVAILABLE = False
_groq_client = None
try:
    from groq import Groq
    _groq_key = os.getenv("GROQ_API_KEY", "")
    if _groq_key:
        _groq_client = Groq(api_key=_groq_key)
        GROQ_AVAILABLE = True
        logger.info("✅ Groq API configured")
    else:
        logger.warning("⚠️  GROQ_API_KEY not set — Groq fallback disabled")
except ImportError:
    logger.warning("⚠️  groq package not installed. Run: pip install groq")
except TypeError as e:
    logger.warning(f"⚠️  Groq client failed to initialize (httpx version conflict): {e}. Groq fallback disabled.")

# ─── 3. OpenRouter Setup ──────────────────────────────────────────────────────
# Sign up FREE at https://openrouter.ai — free models available (no credit card)
# Free models: google/gemma-3-27b-it:free, mistralai/mistral-7b-instruct:free
_OPENROUTER_MODELS = [
    "google/gemma-3-27b-it:free",          # Google Gemma 3 27B — completely free
    "mistralai/mistral-7b-instruct:free",   # Mistral 7B — completely free
    "meta-llama/llama-3.2-3b-instruct:free", # Llama 3.2 3B — free
]
OPENROUTER_AVAILABLE = False
_openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
if _openrouter_key:
    OPENROUTER_AVAILABLE = True
    logger.info("✅ OpenRouter API configured")
else:
    logger.warning("⚠️  OPENROUTER_API_KEY not set — OpenRouter fallback disabled")


# ─── Internal Helpers ─────────────────────────────────────────────────────────

def _clean_json_response(text: str) -> dict:
    """Strip markdown fences and parse JSON from AI response."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.error(f"Non-JSON AI response: {text[:300]}")
        return {}


async def _call_gemini(prompt: str, expect_json: bool = True) -> dict | str:
    """Try each Gemini model in sequence."""
    last_error = None
    for model_name in _GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, lambda m=model: m.generate_content(prompt)
            )
            text = response.text.strip()
            logger.info(f"✅ Gemini success: {model_name}")
            return _clean_json_response(text) if expect_json else text
        except Exception as e:
            last_error = e
            logger.warning(f"⚠️  Gemini {model_name} failed: {e}")
    raise last_error or Exception("All Gemini models failed")


async def _call_groq(prompt: str, expect_json: bool = True) -> dict | str:
    """Try each Groq model in sequence (OpenAI-compatible)."""
    last_error = None
    for model_name in _GROQ_MODELS:
        try:
            loop = asyncio.get_event_loop()
            completion = await loop.run_in_executor(
                None,
                lambda m=model_name: _groq_client.chat.completions.create(
                    model=m,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=2048,
                )
            )
            text = completion.choices[0].message.content.strip()
            logger.info(f"✅ Groq success: {model_name}")
            return _clean_json_response(text) if expect_json else text
        except Exception as e:
            last_error = e
            logger.warning(f"⚠️  Groq {model_name} failed: {e}")
    raise last_error or Exception("All Groq models failed")


async def _call_openrouter(prompt: str, expect_json: bool = True) -> dict | str:
    """Try OpenRouter free models (OpenAI-compatible API)."""
    import httpx
    last_error = None
    for model_name in _OPENROUTER_MODELS:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {_openrouter_key}",
                        "HTTP-Referer": "https://amisync.com",
                        "X-Title": "AmiSync",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 2048,
                    }
                )
                response.raise_for_status()
                text = response.json()["choices"][0]["message"]["content"].strip()
                logger.info(f"✅ OpenRouter success: {model_name}")
                return _clean_json_response(text) if expect_json else text
        except Exception as e:
            last_error = e
            logger.warning(f"⚠️  OpenRouter {model_name} failed: {e}")
    raise last_error or Exception("All OpenRouter models failed")


async def _call_ai(prompt: str, expect_json: bool = True) -> dict | str:
    """
    Unified AI caller — tries providers in order:
    Gemini → Groq → OpenRouter → raises Exception

    Usage: result = await _call_ai(prompt, expect_json=True)
    """
    # 1. Try Gemini (primary)
    if GEMINI_AVAILABLE:
        try:
            return await _call_gemini(prompt, expect_json)
        except Exception as e:
            logger.warning(f"🔄 Gemini exhausted, switching to Groq: {e}")

    # 2. Try Groq (secondary — fastest, 14400 req/day free)
    if GROQ_AVAILABLE:
        try:
            return await _call_groq(prompt, expect_json)
        except Exception as e:
            logger.warning(f"🔄 Groq exhausted, switching to OpenRouter: {e}")

    # 3. Try OpenRouter (tertiary — free models)
    if OPENROUTER_AVAILABLE:
        try:
            return await _call_openrouter(prompt, expect_json)
        except Exception as e:
            logger.warning(f"🔄 OpenRouter failed: {e}")

    raise Exception("All AI providers exhausted. Check API keys.")


# ─── ATS Scorer ──────────────────────────────────────────────────────────────

_SKILL_CATEGORIES = {
    "Frontend": ["react", "javascript", "js", "next.js", "nextjs", "html", "css", "tailwind", "typescript", "ts", "vue", "angular", "svelte"],
    "Backend": ["fastapi", "python", "docker", "node", "nodejs", "django", "flask", "golang", "rust", "java", "spring", "express"],
    "Database": ["postgresql", "postgres", "mongodb", "mongo", "sql", "redis", "firebase", "mysql", "nosql", "dynamodb", "sqlite"],
    "Cloud": ["aws", "docker", "kubernetes", "k8s", "azure", "gcp", "terraform", "devops", "ci/cd", "github actions", "jenkins"],
    "AI_ML": ["machine learning", "ml", "ai", "pytorch", "tensorflow", "nlp", "scikit-learn", "pandas", "numpy", "llm", "langchain"],
}


def _rule_based_ats(resume_text: str, job_description: str) -> dict:
    """Fallback ATS scorer when Gemini is unavailable."""
    resume_lower = resume_text.lower()
    jd_lower = job_description.lower()

    all_keywords = [s for skills in _SKILL_CATEGORIES.values() for s in skills]
    chart_data = {}
    for cat, skills in _SKILL_CATEGORIES.items():
        found = [s for s in skills if s in resume_lower]
        chart_data[cat] = int((len(set(found)) / len(skills)) * 100) if skills else 0

    required_in_jd = list(set([w for w in all_keywords if w in jd_lower]))
    matched_skills = [s for s in required_in_jd if s in resume_lower]
    missing_skills = [s for s in required_in_jd if s not in resume_lower]

    score_val = (len(matched_skills) / len(required_in_jd)) * 100 if required_in_jd else 70
    feedback = f"You match {len(matched_skills)} key skills. "
    if missing_skills:
        top_missing = missing_skills[:2]
        feedback += f"Add {' and '.join(top_missing)} to improve your chances."
    else:
        feedback += "Your profile is an excellent match for this role!"

    return {
        "score": int(score_val),
        "matched_skills": matched_skills[:15],
        "missing_skills": missing_skills[:10],
        "chart_data": chart_data,
        "feedback": feedback,
    }


async def get_ats_score(resume_text: str, job_description: str) -> dict:
    """Score resume against job description using Gemini AI."""
    if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
        return _rule_based_ats(resume_text or "", job_description or "")

    prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer.

Analyze this resume against the job description and return a detailed compatibility report.

RESUME:
{resume_text[:3000]}

JOB DESCRIPTION:
{job_description[:2000]}

Return a JSON object with exactly these fields:
{{
  "score": <integer 0-100>,
  "matched_skills": ["skill1", "skill2", ...],
  "missing_skills": ["skill1", "skill2", ...],
  "chart_data": {{
    "Frontend": <0-100>,
    "Backend": <0-100>,
    "Database": <0-100>,
    "Cloud": <0-100>,
    "AI_ML": <0-100>
  }},
  "feedback": "<2-3 sentence actionable feedback>"
}}

Rules:
- Score must reflect true keyword + skill match density
- matched_skills: skills present in BOTH resume and job description (max 15)
- missing_skills: skills in job description NOT in resume (max 10)  
- chart_data: estimate category strength from resume content (0-100 each)
- feedback: specific, actionable improvement tips

Return ONLY valid JSON, no markdown."""

    try:
        result = await _call_ai(prompt, expect_json=True)
        if result and "score" in result:
            result["score"] = max(0, min(100, int(result.get("score", 50))))
            return result
    except Exception as e:
        logger.error(f"Gemini ATS error: {e}")

    return _rule_based_ats(resume_text, job_description)


# ─── AI Resume Writer ─────────────────────────────────────────────────────────

async def generate_resume_content(
    full_name: str,
    profession: str,
    experience: list[dict],
    skills: list[str],
    education: list[dict],
    target_job: str = "",
    template_style: str = "professional",
) -> dict:
    """Generate a complete resume using Gemini AI."""
    if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
        return {"error": "Gemini API not configured. Set GEMINI_API_KEY in .env"}

    exp_text = "\n".join(
        f"- {e.get('title', '')} at {e.get('company', '')} ({e.get('duration', '')}): {e.get('description', '')}"
        for e in (experience or [])
    )
    edu_text = "\n".join(
        f"- {e.get('degree', '')} from {e.get('institution', '')} ({e.get('year', '')})"
        for e in (education or [])
    )

    prompt = f"""You are an expert resume writer specializing in ATS-optimized, impactful resumes.

Create a compelling, professional resume for:
- Name: {full_name}
- Target Role: {target_job or profession}
- Style: {template_style}

EXPERIENCE:
{exp_text or "Not provided"}

SKILLS: {', '.join(skills or [])}

EDUCATION:
{edu_text or "Not provided"}

Return a JSON object with these fields:
{{
  "professional_summary": "<3-4 compelling sentences highlighting value proposition>",
  "enhanced_skills": ["skill1", "skill2", ...],
  "experience_bullets": [
    {{
      "company": "...",
      "title": "...",
      "bullets": ["• Achievement 1 with metrics", "• Achievement 2", "• Achievement 3"]
    }}
  ],
  "key_achievements": ["Achievement 1 with metric", "Achievement 2"],
  "ats_keywords": ["keyword1", "keyword2", ...]
}}

Rules:
- Use strong action verbs (Led, Built, Optimized, Delivered, Increased)
- Include quantifiable metrics where possible (improved X by Y%)
- Make it ATS-friendly with relevant keywords
- Keep professional summary punchy and results-focused
- Return ONLY valid JSON"""

    try:
        return await _call_ai(prompt, expect_json=True)
    except Exception as e:
        logger.error(f"Resume generation error: {e}")
        return {"error": str(e)}


# ─── Cover Letter Generator ───────────────────────────────────────────────────

async def generate_cover_letter(
    full_name: str,
    profession: str,
    skills: list[str],
    company_name: str,
    job_title: str,
    job_description: str = "",
    tone: str = "professional",
) -> str:
    """Generate a personalized cover letter using Gemini AI."""
    if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
        return f"""Dear Hiring Manager,

I am writing to express my strong interest in the {job_title} position at {company_name}. With my background in {profession} and expertise in {', '.join((skills or [])[:5])}, I am confident in my ability to make a meaningful contribution to your team.

Throughout my career, I have developed strong technical and collaborative skills that align well with your requirements. I am particularly drawn to {company_name}'s mission and believe my experience would allow me to hit the ground running.

I would welcome the opportunity to discuss how my background aligns with your needs. Thank you for considering my application.

Sincerely,
{full_name}"""

    prompt = f"""You are an expert career coach writing a compelling, personalized cover letter.

Write a {tone} cover letter for:
- Applicant: {full_name} ({profession})
- Company: {company_name}
- Role: {job_title}
- Skills: {', '.join(skills or [])}

{f'Job Description Highlights: {job_description[:500]}' if job_description else ''}

Requirements:
- 3-4 paragraphs, 250-350 words total
- Opening: Hook with specific reason for applying to THIS company
- Body: Connect 2-3 specific skills/experiences to role requirements
- Closing: Confident call to action
- Tone: {tone}
- Do NOT use generic phrases like "I am writing to apply"
- Include company name naturally in the letter
- Return ONLY the letter text, no subject line or metadata"""

    try:
        return await _call_ai(prompt, expect_json=False)
    except Exception as e:
        logger.error(f"Cover letter error: {e}")
        return f"Error generating cover letter: {e}"


# ─── Skill Gap Analyzer ───────────────────────────────────────────────────────

async def analyze_skill_gap(
    current_skills: list[str],
    target_role: str,
    experience_years: float = 0,
) -> dict:
    """Analyze skill gaps for a target role using Gemini AI."""
    if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
        return {
            "missing_critical": ["Communication", "Problem Solving"],
            "missing_nice_to_have": ["Cloud Experience"],
            "learning_path": [
                {"skill": "Communication", "resources": ["Coursera", "LinkedIn Learning"], "timeline": "1 month"},
            ],
            "market_demand": "High",
            "salary_range": "Not available without API",
            "readiness_score": 65,
        }

    prompt = f"""You are a career advisor with deep knowledge of tech job markets.

Analyze the skill gap for someone transitioning to: {target_role}
Current skills: {', '.join(current_skills or ['None listed'])}
Years of experience: {experience_years}

Return JSON:
{{
  "missing_critical": ["skill1", ...],
  "missing_nice_to_have": ["skill1", ...],
  "learning_path": [
    {{
      "skill": "...",
      "resources": ["Resource 1", "Resource 2"],
      "timeline": "X weeks/months"
    }}
  ],
  "market_demand": "High/Medium/Low",
  "salary_range": "$X - $Y",
  "readiness_score": <0-100>,
  "recommendation": "<2-3 sentence career advice>"
}}

Return ONLY valid JSON."""

    try:
        return await _call_ai(prompt, expect_json=True)
    except Exception as e:
        logger.error(f"Skill gap error: {e}")
        return {"error": str(e)}


# ─── LinkedIn Summary Generator ───────────────────────────────────────────────

async def generate_linkedin_summary(
    full_name: str,
    profession: str,
    skills: list[str],
    experience_years: float = 0,
    achievements: str = "",
) -> str:
    """Generate an optimized LinkedIn About section."""
    if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
        return f"{full_name} is a {profession} with {experience_years} years of experience specializing in {', '.join((skills or [])[:5])}."

    prompt = f"""Write an optimized LinkedIn About section for:
- Name: {full_name}
- Role: {profession}
- Experience: {experience_years} years
- Key Skills: {', '.join(skills or [])}
- Achievements: {achievements or 'Not specified'}

Requirements:
- 150-200 words
- First person, conversational but professional
- Hook in first sentence (don't start with "I am")
- Highlight 2-3 key value propositions
- Include a call-to-action at the end
- Include relevant keywords for LinkedIn search
- Return ONLY the summary text"""

    try:
        return await _call_ai(prompt, expect_json=False)
    except Exception as e:
        logger.error(f"LinkedIn summary error: {e}")
        return f"Error: {e}"


async def generate_outreach_email(
    user_name: str,
    user_profession: str,
    user_skills: list[str],
    user_resume_snippet: str,
    contact_name: str,
    contact_company: str,
    contact_title: str,
    past_examples: list[dict] = None
) -> dict:
    """Generate an outreach email using Gemini, learning from past template styles."""
    if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
        subject = f"Inquiry regarding open roles at {contact_company} - {user_name}"
        body = (
            f"Dear {contact_name},\n\n"
            f"I hope this email finds you well.\n\n"
            f"My name is {user_name}, and I am a {user_profession} specializing in {', '.join(user_skills[:4])}. "
            f"I have been following {contact_company}'s growth and would love to discuss how my skillset could support your team.\n\n"
            f"Looking forward to hearing from you.\n\n"
            f"Best regards,\n"
            f"{user_name}"
        )
        return {"subject": subject, "body": body}

    few_shot_prompt = ""
    if past_examples:
        few_shot_prompt = "\nHere are examples of previous successful outreach emails for style reference:\n"
        for idx, ex in enumerate(past_examples[:3]):
            few_shot_prompt += f"Example {idx+1}:\nSubject: {ex.get('subject')}\nBody: {ex.get('body')}\n---\n"

    prompt = f"""You are an AI assistant helping a job seeker write a professional outreach email to a recruiter or hiring manager.

Context:
- Job Seeker Name: {user_name}
- Profession: {user_profession}
- Core Skills: {', '.join(user_skills)}
- Resume highlights: {user_resume_snippet[:1000]}

Recipient:
- Name: {contact_name}
- Company: {contact_company}
- Job Title: {contact_title or 'Hiring Coordinator'}
{few_shot_prompt}
Write a concise, compelling email that makes a clear pitch and requests a short intro chat.

Return a JSON object with exactly these fields:
{{
  "subject": "<Compelling, professional email subject line>",
  "body": "<Email body content with proper paragraphs, greetings, and signature>"
}}

Return ONLY valid JSON, no markdown code fences."""

    try:
        result = await _call_ai(prompt, expect_json=True)
        if result and "subject" in result and "body" in result:
            return result
    except Exception as e:
        logger.error(f"Outreach email generation error: {e}")

    return {
        "subject": f"Inquiry regarding open roles at {contact_company} - {user_name}",
        "body": f"Dear {contact_name},\n\nI hope this email finds you well. My name is {user_name}, and I am a {user_profession} interested in opportunities at {contact_company}.\n\nBest regards,\n{user_name}"
    }


async def generate_cover_letter(
    full_name: str,
    profession: str,
    skills: list,
    company_name: str,
    job_title: str,
    job_description: str = "",
    tone: str = "professional"
) -> str:
    """Generate a personalized, high-converting cover letter using Gemini AI."""
    
    prompt = f"""You are an expert career coach and professional writer. Write a tailored cover letter for the following job application:

Candidate details:
- Name: {full_name}
- Profession: {profession}
- Core Skills: {', '.join(skills)}

Job details:
- Position: {job_title}
- Company: {company_name}
- Job Description: {job_description}

Tone: {tone} (e.g. professional, enthusiastic, confident)

Instructions:
1. Address the cover letter to the hiring team at {company_name}.
2. Make a strong opening paragraph explaining the candidate's interest in the {job_title} role at {company_name}.
3. Connect the candidate's core skills ({', '.join(skills)}) and background to the key requirements in the job description.
4. Keep it concise, engaging, and professional. Limit it to 3-4 paragraphs.
5. Close with a clear call to action (requesting an interview/meeting) and a professional sign-off.

Do NOT return JSON. Return ONLY the final formatted cover letter text in markdown format."""

    if GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE:
        try:
            logger.info("Calling Gemini for cover letter generation...")
            result = await _call_ai(prompt, expect_json=False)
            if result and len(result.strip()) > 50:
                return result
        except Exception as e:
            logger.error(f"Failed to generate cover letter with Gemini: {e}")

    # Fallback template
    skills_text = f"my expertise in {', '.join(skills)}" if skills else f"my background as a {profession}"
    return f"""Dear Hiring Team,

I am writing to express my strong interest in the {job_title} position at {company_name}. With my background as a {profession} and {skills_text}, I am confident in my ability to make a meaningful contribution to your team.

I have been following {company_name}'s recent achievements and am inspired by your commitment to innovation. I am eager to apply my technical and collaborative skills to help drive your upcoming projects forward and solve complex challenges.

Thank you for your time and consideration. I welcome the opportunity to discuss how my experiences align with the needs of {company_name} in an interview.

Sincerely,
{full_name}"""


async def rewrite_bullet_point(bullet_text: str, role: str) -> list[str]:
    """Rewrite a resume bullet point to make it more professional, ATS-optimized, and metrics-driven."""
    prompt = f"""You are an elite professional resume writer.
Optimize this resume bullet point to make it highly professional, impact-driven, and ATS-optimized.

Original Bullet: \"{bullet_text}\"
Target Role: \"{role}\"

Generate exactly 3 professional variations. Each variation must:
1. Start with a strong action verb (e.g., Architected, Spearheaded, Optimized, Quantified).
2. Incorporate a realistic quantifiable metric (e.g., improved efficiency by 25%, reduced cost by $12K, increased user engagement by 18%).
3. Be concise (1 sentence).

Return a JSON array containing exactly 3 strings:
[
  \"Variation 1...\",
  \"Variation 2...\",
  \"Variation 3...\"
]

Return ONLY valid JSON."""

    if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
        return [
            f"Optimized {bullet_text} to improve system efficiency and user satisfaction.",
            f"Spearheaded development of {bullet_text}, leading to improved performance metrics.",
            f"Led team efforts on {bullet_text} and successfully delivered project objectives ahead of schedule."
        ]

    try:
        result = await _call_ai(prompt, expect_json=True)
        if isinstance(result, list) and len(result) >= 3:
            return result[:3]
    except Exception as e:
        logger.error(f"Bullet rewriter error: {e}")

    return [
        f"Optimized {bullet_text} to improve system efficiency and user satisfaction.",
        f"Spearheaded development of {bullet_text}, leading to improved performance metrics.",
        f"Led team efforts on {bullet_text} and successfully delivered project objectives ahead of schedule."
    ]
