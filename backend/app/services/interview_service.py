"""
AI Mock Interview Service - LIVE VIDEO INTERVIEWS
Handles one-on-one interviews with video, screen share, and real-time feedback
Features: Video + Audio, Screen Share, AI Text-to-Speech, Real-time Feedback
"""

from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime, timedelta
import uuid
import random
from collections import Counter
from pydantic import BaseModel
from sqlalchemy.orm import Session

class InterviewRole(str, Enum):
    JUNIOR_DEVELOPER = "Junior Developer"
    SENIOR_DEVELOPER = "Senior Developer"
    DEVOPS_ENGINEER = "DevOps Engineer"
    DATA_SCIENTIST = "Data Scientist"
    PRODUCT_MANAGER = "Product Manager"
    FULLSTACK_ENGINEER = "Full Stack Engineer"
    SALES_EXECUTIVE = "Sales Executive"
    MARKETING_SPECIALIST = "Marketing Specialist"
    CUSTOMER_SUPPORT = "Customer Support Specialist"
    HR_SPECIALIST = "HR Specialist"
    REGISTERED_NURSE = "Registered Nurse"
    EDUCATOR_TEACHER = "Educator / Teacher"
    ACCOUNTANT = "Accountant"

class InterviewQuestion(BaseModel):
    id: str
    question_text: str
    role: str
    difficulty: str  # easy, medium, hard
    category: str  # behavioral, technical, system-design
    expected_keywords: List[str]
    tts_audio_url: Optional[str] = None

class InterviewFeedback(BaseModel):
    score_out_of_10: int
    technical_depth: str
    communication: str
    problem_solving: str
    confidence: str
    strengths: List[str]
    improvements: List[str]
    overall_comment: str

class InterviewSession(BaseModel):
    session_id: str
    user_id: int
    role: InterviewRole
    started_at: datetime
    questions: List[InterviewQuestion] = []
    current_question_index: int = 0
    answers: List[str] = []
    feedback_list: List[Dict] = []
    overall_score: float = 0.0
    status: str = "active"  # active, completed, paused
    rtc_offer: Optional[Dict] = None
    rtc_answer: Optional[Dict] = None
    screen_share_active: bool = False

class MockInterviewService:
    """Service for managing LIVE video mock interviews"""
    
    def __init__(self):
        self.sessions: Dict[str, InterviewSession] = {}
        self.questions_bank = self._initialize_questions()
    
    def _initialize_questions(self) -> Dict[str, List[InterviewQuestion]]:
        """Initialize comprehensive question bank"""
        return {
            InterviewRole.SENIOR_DEVELOPER: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about the most complex system you've designed. What were the key architectural decisions and trade-offs?",
                    role=InterviewRole.SENIOR_DEVELOPER,
                    difficulty="hard",
                    category="system-design",
                    expected_keywords=["architecture", "scalability", "trade-offs", "database", "caching", "performance"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe a situation where you had to refactor legacy code. What was your approach and what did you learn?",
                    role=InterviewRole.SENIOR_DEVELOPER,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["planning", "testing", "incremental", "team", "risks", "metrics"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you approach code reviews? What are the key things you look for and how do you provide feedback?",
                    role=InterviewRole.SENIOR_DEVELOPER,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["clarity", "performance", "security", "maintainability", "constructive", "communication"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Walk me through your experience with distributed systems. What challenges have you faced?",
                    role=InterviewRole.SENIOR_DEVELOPER,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["consistency", "consensus", "latency", "fault tolerance", "challenges"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you mentor junior developers? Tell me about a specific example.",
                    role=InterviewRole.SENIOR_DEVELOPER,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["feedback", "growth", "learning", "guidance", "development", "patience"]
                ),
            ],
            InterviewRole.JUNIOR_DEVELOPER: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Explain what REST APIs are and why they're useful. Can you give me a concrete example?",
                    role=InterviewRole.JUNIOR_DEVELOPER,
                    difficulty="easy",
                    category="technical",
                    expected_keywords=["HTTP", "endpoints", "JSON", "GET", "POST", "client-server"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about a project you built. What technologies did you use and what did you learn?",
                    role=InterviewRole.JUNIOR_DEVELOPER,
                    difficulty="easy",
                    category="behavioral",
                    expected_keywords=["built", "learned", "technologies", "challenge", "solution"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you debug a problem in your code? Walk me through your process.",
                    role=InterviewRole.JUNIOR_DEVELOPER,
                    difficulty="easy",
                    category="technical",
                    expected_keywords=["error", "console", "breakpoints", "logs", "variables", "testing"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Explain the difference between a class and an object in programming.",
                    role=InterviewRole.JUNIOR_DEVELOPER,
                    difficulty="easy",
                    category="technical",
                    expected_keywords=["class", "object", "instance", "blueprint", "properties", "methods"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about a time you had to learn something new on the job. How did you approach it?",
                    role=InterviewRole.JUNIOR_DEVELOPER,
                    difficulty="easy",
                    category="behavioral",
                    expected_keywords=["learned", "research", "practice", "resources", "struggled", "overcame"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="What is version control and why is it important? Have you used Git?",
                    role=InterviewRole.JUNIOR_DEVELOPER,
                    difficulty="easy",
                    category="technical",
                    expected_keywords=["version control", "git", "commit", "branch", "collaboration", "history"]
                ),
            ],
            InterviewRole.DEVOPS_ENGINEER: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Explain your experience with Kubernetes. What are the main components and how do they work together?",
                    role=InterviewRole.DEVOPS_ENGINEER,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["pods", "services", "deployments", "ingress", "orchestration", "containers"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe a critical incident you handled. Walk me through your incident response process.",
                    role=InterviewRole.DEVOPS_ENGINEER,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["incident", "response", "communication", "root cause", "prevention"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Explain CI/CD pipelines. How do you implement them and what tools have you used?",
                    role=InterviewRole.DEVOPS_ENGINEER,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["CI", "CD", "jenkins", "gitlab", "github", "automated", "testing", "deployment"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you approach infrastructure as code? What benefits does it provide?",
                    role=InterviewRole.DEVOPS_ENGINEER,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["terraform", "cloudformation", "ansible", "reproducible", "version control", "documentation"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about your monitoring and observability setup. What metrics do you track?",
                    role=InterviewRole.DEVOPS_ENGINEER,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["monitoring", "prometheus", "grafana", "logs", "metrics", "alerts", "observability"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you handle database backups and disaster recovery?",
                    role=InterviewRole.DEVOPS_ENGINEER,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["backups", "recovery", "failover", "replication", "RTO", "RPO", "testing"]
                ),
            ],
            InterviewRole.DATA_SCIENTIST: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about a machine learning project you worked on. What was the problem and how did you solve it?",
                    role=InterviewRole.DATA_SCIENTIST,
                    difficulty="hard",
                    category="behavioral",
                    expected_keywords=["machine learning", "model", "training", "evaluation", "metrics", "insights"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Explain the difference between supervised and unsupervised learning. When would you use each?",
                    role=InterviewRole.DATA_SCIENTIST,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["supervised", "unsupervised", "labeled", "unlabeled", "classification", "clustering", "regression"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you handle missing data in your datasets? What approaches have you used?",
                    role=InterviewRole.DATA_SCIENTIST,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["imputation", "dropping", "forward fill", "interpolation", "analysis", "impact"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe your experience with feature engineering. How do you identify important features?",
                    role=InterviewRole.DATA_SCIENTIST,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["feature engineering", "selection", "correlation", "importance", "domain knowledge", "dimensionality"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about model validation techniques you use. Why is cross-validation important?",
                    role=InterviewRole.DATA_SCIENTIST,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["validation", "cross-validation", "train-test split", "overfitting", "underfitting", "generalization"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you communicate complex statistical results to non-technical stakeholders?",
                    role=InterviewRole.DATA_SCIENTIST,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["visualization", "storytelling", "business impact", "simple", "clear", "presentation"]
                ),
            ],
            InterviewRole.PRODUCT_MANAGER: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Walk me through how you approach defining a product strategy. What steps do you take?",
                    role=InterviewRole.PRODUCT_MANAGER,
                    difficulty="hard",
                    category="behavioral",
                    expected_keywords=["market", "users", "goals", "research", "competitive", "vision", "roadmap"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about a product failure or pivot you experienced. How did you handle it?",
                    role=InterviewRole.PRODUCT_MANAGER,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["failure", "pivot", "learned", "team", "communication", "adapted", "resilience"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you prioritize features? What frameworks or methodologies do you use?",
                    role=InterviewRole.PRODUCT_MANAGER,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["prioritization", "MoSCoW", "RICE", "impact", "effort", "value", "user needs"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe your experience with user research. How do you validate product ideas?",
                    role=InterviewRole.PRODUCT_MANAGER,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["user research", "interviews", "surveys", "testing", "feedback", "validation", "data"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you measure product success? What metrics do you track?",
                    role=InterviewRole.PRODUCT_MANAGER,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["metrics", "KPI", "OKR", "engagement", "retention", "conversion", "analytics"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about a time you had to manage conflicting priorities between stakeholders.",
                    role=InterviewRole.PRODUCT_MANAGER,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["stakeholders", "conflict", "alignment", "communication", "compromise", "decision"]
                ),
            ],
            InterviewRole.FULLSTACK_ENGINEER: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe a full-stack project you built. Walk me through the architecture and technology choices.",
                    role=InterviewRole.FULLSTACK_ENGINEER,
                    difficulty="hard",
                    category="behavioral",
                    expected_keywords=["architecture", "frontend", "backend", "database", "deployment", "choices", "trade-offs"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you approach building scalable applications? What considerations do you make?",
                    role=InterviewRole.FULLSTACK_ENGINEER,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["scalability", "caching", "database", "load balancing", "microservices", "optimization"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Explain your experience with both frontend and backend development. Which do you prefer and why?",
                    role=InterviewRole.FULLSTACK_ENGINEER,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["frontend", "backend", "prefer", "strengths", "weakness", "balance", "tools"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you approach testing in a full-stack application? What's your testing strategy?",
                    role=InterviewRole.FULLSTACK_ENGINEER,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["unit testing", "integration testing", "E2E", "coverage", "Jest", "Pytest", "Selenium"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Tell me about your deployment process. How do you ensure smooth deployments?",
                    role=InterviewRole.FULLSTACK_ENGINEER,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["CI/CD", "deployment", "rollback", "monitoring", "testing", "documentation", "downtime"]
                ),
                 InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you optimize performance in full-stack applications? Frontend and backend?",
                    role=InterviewRole.FULLSTACK_ENGINEER,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["optimization", "caching", "compression", "lazy loading", "database queries", "async"]
                ),
            ],
            InterviewRole.SALES_EXECUTIVE: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you handle rejection in a sales pipeline, and what techniques do you use to overcome objections?",
                    role=InterviewRole.SALES_EXECUTIVE,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["objections", "relationship building", "active listening", "follow-up", "resilience"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Walk me through your process for qualifying a prospect and closing a high-value enterprise deal.",
                    role=InterviewRole.SALES_EXECUTIVE,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["enterprise sales", "prospecting", "deal closing", "negotiation", "contracting"]
                )
            ],
            InterviewRole.MARKETING_SPECIALIST: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe a successful marketing campaign you led. What metrics did you track to define success?",
                    role=InterviewRole.MARKETING_SPECIALIST,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["campaign", "metrics", "analytics", "ROI", "conversion rate", "SEO", "PPC"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How would you optimize user acquisition cost and calculate return on ad spend (ROAS) across multiple channels?",
                    role=InterviewRole.MARKETING_SPECIALIST,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["CAC", "ROAS", "channels", "attribution", "budgeting", "A/B testing"]
                )
            ],
            InterviewRole.CUSTOMER_SUPPORT: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you handle an extremely angry customer who is demanding an immediate refund for a service failure?",
                    role=InterviewRole.CUSTOMER_SUPPORT,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["de-escalate", "empathy", "active listening", "solution", "company policy"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you balance ticket resolution speed with maintaining high customer satisfaction (CSAT) scores?",
                    role=InterviewRole.CUSTOMER_SUPPORT,
                    difficulty="medium",
                    category="technical",
                    expected_keywords=["CSAT", "SLA", "prioritization", "efficiency", "first response time", "quality"]
                )
            ],
            InterviewRole.HR_SPECIALIST: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you manage conflict between a manager and their direct report while remaining neutral?",
                    role=InterviewRole.HR_SPECIALIST,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["conflict resolution", "neutrality", "mediation", "employment law", "documentation"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="What metrics do you look at to evaluate recruitment funnel efficiency and employee retention rates?",
                    role=InterviewRole.HR_SPECIALIST,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["retention", "recruitment funnel", "turnover rate", "time-to-hire", "onboarding success"]
                )
            ],
            InterviewRole.REGISTERED_NURSE: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe a time when you had to handle a high-stress medical emergency. What was your role and how did you coordinate with the clinical team?",
                    role=InterviewRole.REGISTERED_NURSE,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["emergency", "coordination", "clinical", "triage", "communication", "calm"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="How do you handle patient advocacy when you disagree with a physician's treatment plan?",
                    role=InterviewRole.REGISTERED_NURSE,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["patient advocacy", "compliance", "ethics", "communication", "safety", "escalation"]
                )
            ],
            InterviewRole.EDUCATOR_TEACHER: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="What is your philosophy on classroom management, and how do you handle highly disruptive students?",
                    role=InterviewRole.EDUCATOR_TEACHER,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["classroom management", "de-escalation", "empathy", "structure", "positive reinforcement"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe a lesson plan you developed that failed to engage students, and how you adapted it in real-time.",
                    role=InterviewRole.EDUCATOR_TEACHER,
                    difficulty="medium",
                    category="scenario",
                    expected_keywords=["adaptation", "engagement", "feedback", "assessment", "learning outcomes"]
                )
            ],
            InterviewRole.ACCOUNTANT: [
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Walk me through how you prepare for a financial audit and ensure regulatory compliance.",
                    role=InterviewRole.ACCOUNTANT,
                    difficulty="hard",
                    category="technical",
                    expected_keywords=["audit", "compliance", "reconciliation", "general ledger", "GAAP", "documentation"]
                ),
                InterviewQuestion(
                    id=str(uuid.uuid4()),
                    question_text="Describe a time when you discovered a discrepancy in financial records. How did you investigate and resolve it?",
                    role=InterviewRole.ACCOUNTANT,
                    difficulty="medium",
                    category="behavioral",
                    expected_keywords=["discrepancy", "investigation", "reconciliation", "internal controls", "verification"]
                )
            ],
        }
    
    async def start_interview_dynamic(self, user_id: int, role: InterviewRole, db_session: Session) -> Dict:
        """Start a live interview session with dynamically generated questions tailored to the user's resume and profile."""
        from sqlalchemy.orm import Session
        from app.models.user import User
        from app.services.ai_service import _call_ai, GEMINI_AVAILABLE, GROQ_AVAILABLE, OPENROUTER_AVAILABLE
        
        session_id = str(uuid.uuid4())
        selected_questions = []
        
        # 1. Fetch user profile context
        user = db_session.query(User).filter(User.id == user_id).first()
        profession = user.profession if user and user.profession else "General Professional"
        experience_years = user.years_of_experience if user and user.years_of_experience is not None else 0.0
        resume_text = user.resume_text if user and user.resume_text else ""
        
        # 2. Try to dynamically generate questions using AI if available
        if GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE:
            prompt = f"""You are an elite corporate interviewer. Generate exactly 5 interview questions for a candidate.

TARGET POSITION/ROLE: {role.value}
INDUSTRY FIELD: {profession}
YEARS OF EXPERIENCE: {experience_years} years
"""
            if resume_text:
                # Include up to 15,000 characters of the candidate's resume
                prompt += f"\nCANDIDATE RESUME SUMMARY:\n{resume_text[:15000]}\n"
                
            prompt += """
Instructions:
- The interview must consist of exactly 5 questions.
- Mix technical, behavioral, and situational/scenario questions relevant to the target role and experience level.
- If a resume is provided, customize at least 2 questions to target the specific projects, skills, or achievements mentioned in the resume (refer to specific details from their resume).
- For each question, provide 5-8 expected keywords/key concepts that a strong answer should cover.
- Format the response as a JSON object with a single "questions" key containing a list of objects with these exact fields:
  {
    "questions": [
      {
        "question_text": "...",
        "difficulty": "easy|medium|hard",
        "category": "technical|behavioral|scenario",
        "expected_keywords": ["keyword1", "keyword2", ...]
      },
      ...
    ]
  }
- Return ONLY valid JSON. Do not write any markdown blocks (like ```json) or explanation.
"""
            try:
                result = await _call_ai(prompt, expect_json=True)
                if isinstance(result, dict) and "questions" in result:
                    raw_questions = result["questions"]
                    if len(raw_questions) == 5:
                        for q in raw_questions:
                            selected_questions.append(
                                InterviewQuestion(
                                    id=str(uuid.uuid4()),
                                    question_text=q.get("question_text", ""),
                                    role=role.value,
                                    difficulty=q.get("difficulty", "medium"),
                                    category=q.get("category", "technical"),
                                    expected_keywords=q.get("expected_keywords", [])
                                )
                            )
            except Exception as e:
                print(f"[AI QUESTION GEN ERROR] Dynamic questions failed: {e}. Falling back to default questions bank.")
                
        # 3. Fallback to predefined questions bank if AI failed or returned invalid format
        if len(selected_questions) < 5:
            questions = self.questions_bank.get(role, self.questions_bank[InterviewRole.JUNIOR_DEVELOPER])
            # If bank doesn't have enough, reuse them or sample as many as we can
            selected_questions = random.sample(questions, min(5, len(questions)))
            
        # 4. Initialize session
        session = InterviewSession(
            session_id=session_id,
            user_id=user_id,
            role=role,
            started_at=datetime.utcnow(),
            questions=selected_questions,
            status="active"
        )
        
        self.sessions[session_id] = session
        
        return {
            "session_id": session_id,
            "role": role.value,
            "total_questions": len(selected_questions),
            "first_question": selected_questions[0].question_text,
            "message": f"Interview started! Answer {len(selected_questions)} questions dynamically tailored to your background. Voice controls ready."
        }

    def start_interview(self, user_id: int, role: InterviewRole) -> Dict:
        """Start a live interview session with WebRTC support"""
        session_id = str(uuid.uuid4())
        
        questions = self.questions_bank.get(role, self.questions_bank[InterviewRole.JUNIOR_DEVELOPER])
        selected_questions = random.sample(questions, min(5, len(questions)))
        
        session = InterviewSession(
            session_id=session_id,
            user_id=user_id,
            role=role,
            started_at=datetime.utcnow(),
            questions=selected_questions,
            status="active"
        )
        
        self.sessions[session_id] = session
        
        return {
            "session_id": session_id,
            "role": role.value,
            "total_questions": len(selected_questions),
            "first_question": selected_questions[0].question_text,
            "message": f"Interview started! Answer {len(selected_questions)} questions. Video and audio will be enabled."
        }
    
    def get_current_question(self, session_id: str) -> Optional[InterviewQuestion]:
        """Get current question for display"""
        session = self.sessions.get(session_id)
        if not session or session.current_question_index >= len(session.questions):
            return None
        return session.questions[session.current_question_index]
    
    async def submit_answer(self, session_id: str, answer_audio_text: str) -> Dict:
        """
        Submit answer (from audio transcription or text)
        Generate real-time feedback for candidate
        """
        session = self.sessions.get(session_id)
        if not session:
            # Debug: print available sessions
            print(f"[INTERVIEW ERROR] Session not found!")
            print(f"[INTERVIEW ERROR] Requested session_id: {session_id}")
            print(f"[INTERVIEW ERROR] Available session IDs: {list(self.sessions.keys())}")
            raise ValueError(f"Session not found (requested: {session_id}, available: {list(self.sessions.keys())})")
        
        # Check if interview already completed
        if session.current_question_index >= len(session.questions):
            return {
                "feedback": session.feedback_list[-1] if session.feedback_list else {},
                "score_so_far": session.overall_score,
                "next_question": None,
                "questions_remaining": 0,
                "interview_complete": True
            }
        
        current_question = self.get_current_question(session_id)
        if not current_question:
            raise ValueError("No current question")
        
        # Store answer
        session.answers.append(answer_audio_text)
        
        # Generate real-time feedback
        feedback = await self._analyze_answer_realtime(current_question, answer_audio_text)
        session.feedback_list.append(feedback)
        
        # Move to next question
        session.current_question_index += 1
        
        # Update overall score
        self._update_overall_score(session)
        
        # Check if interview is now complete
        if session.current_question_index >= len(session.questions):
            return {
                "feedback": feedback,
                "score_so_far": session.overall_score,
                "next_question": None,
                "questions_remaining": 0,
                "interview_complete": True
            }
        
        # Get next question
        next_question = self.get_current_question(session_id)
        
        return {
            "feedback": feedback,
            "score_so_far": session.overall_score,
            "next_question": next_question.question_text if next_question else None,
            "questions_remaining": len(session.questions) - session.current_question_index,
            "interview_complete": False
        }
    
    async def _analyze_answer_realtime(self, question: InterviewQuestion, answer: str) -> Dict:
        """AI-powered real-time feedback generation using Gemini."""
        from app.services.ai_service import GEMINI_AVAILABLE, GROQ_AVAILABLE, OPENROUTER_AVAILABLE, _call_ai, _rule_based_ats
        
        # Rule-based fallback if Gemini is NOT available
        if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
            return self._analyze_answer_rule_based(question, answer)

        prompt = f"""You are an elite tech interviewer at a top-tier firm (Google/OpenAI).
        Evaluate the candidate's answer to this interview question.

        ROLE: {question.role}
        QUESTION: {question.question_text}
        CANDIDATE ANSWER: {answer}

        Provide a sophisticated evaluation in JSON format with exactly these fields:
        {{
          "score_out_of_10": <int 1-10>,
          "technical_depth": "<1 sentence feedback on accuracy and depth>",
          "communication": "<1 sentence feedback on clarity and structure>",
          "problem_solving": "<1 sentence feedback on methodology>",
          "confidence": "<1 sentence feedback on delivery tone>",
          "strengths": ["strength1", "strength2"],
          "improvements": ["improvement1", "improvement2"],
          "detailed_improvements": [
            {{
              "field": "Technical Depth",
              "current_level": "...",
              "what_to_improve": "...",
              "specific_actions": ["Action 1", "Action 2"]
            }},
            {{
              "field": "Communication",
              "current_level": "...",
              "what_to_improve": "...",
              "specific_actions": ["Action 1"]
            }}
          ],
          "keyword_coverage_percent": <int 0-100 based on: {', '.join(question.expected_keywords)}>
        }}

        Rules:
        - Be critical yet constructive.
        - Look for keyword usage: {', '.join(question.expected_keywords)}
        - scored based on industry standards for {question.role}.
        - Return ONLY valid JSON."""

        try:
            result = await _call_ai(prompt, expect_json=True)
            if result and "score_out_of_10" in result:
                # Ensure missing_keywords field exists for compatibility
                answer_lower = answer.lower()
                result["missing_keywords"] = [kw for kw in question.expected_keywords if kw.lower() not in answer_lower][:5]
                return result
        except Exception as e:
            print(f"[RE-ERROR] Gemini Interview Analysis failed: {e}")

        return self._analyze_answer_rule_based(question, answer)

    def _analyze_answer_rule_based(self, question: InterviewQuestion, answer: str) -> Dict:
        """Original rule-based fallback analysis."""
        answer_lower = answer.lower()
        
        # Calculate keyword coverage
        keywords_found = sum(1 for keyword in question.expected_keywords 
                            if keyword.lower() in answer_lower)
        keyword_coverage = (keywords_found / len(question.expected_keywords)) * 100 if question.expected_keywords else 0
        missing_keywords = [kw for kw in question.expected_keywords if kw.lower() not in answer_lower]
        
        score_base = 5
        strengths = []
        improvements = []
        detailed_improvements = []
        
        # Technical Depth Scoring
        if keyword_coverage >= 70:
            technical_feedback = "Excellent - Strong technical depth with key concepts covered"
            score_base += 3
            strengths.append("Comprehensive technical understanding")
        elif keyword_coverage >= 40:
            technical_feedback = "Good - Solid foundation, consider adding more technical details"
            score_base += 1
            improvements.append("Include more specific technical tools/frameworks")
            detailed_improvements.append({
                "field": "Technical Depth",
                "current_level": f"Covered {int(keyword_coverage)}% of concepts",
                "what_to_improve": f"Missing keywords: {', '.join(missing_keywords[:2])}",
                "specific_actions": ["Add more technical nuance", "Reference specific frameworks"]
            })
        else:
            technical_feedback = "Fair - Add more technical specifics"
            improvements.append("Deepen technical knowledge")
            detailed_improvements.append({
                "field": "Technical Depth",
                "current_level": "Conceptual gaps present",
                "what_to_improve": "Missing industry-standard terminology",
                "specific_actions": ["Study the core stack thoroughly", "Practice technical explanations"]
            })
        
        # Communication
        word_count = len(answer.split())
        communication_feedback = "Good" if word_count > 50 else "Fair"
        
        return {
            "score_out_of_10": min(10, int(score_base)),
            "technical_depth": technical_feedback,
            "communication": communication_feedback,
            "problem_solving": "Fairly structured" if "approach" in answer_lower else "Provide more methodology",
            "confidence": "Developing" if word_count < 30 else "Good presence",
            "strengths": strengths or ["Attempted all sections"],
            "improvements": improvements or ["Elaborate more"],
            "detailed_improvements": detailed_improvements or [{
                "field": "Communication",
                "current_level": "Brief response",
                "what_to_improve": "Add more context",
                "specific_actions": ["Use the STAR method"]
            }],
            "keyword_coverage_percent": int(keyword_coverage),
            "missing_keywords": missing_keywords[:5]
        }

    
    def _update_overall_score(self, session: InterviewSession):
        """Update cumulative interview score"""
        if not session.feedback_list:
            session.overall_score = 0.0
            return
        
        total = sum(f.get("score_out_of_10", 0) for f in session.feedback_list)
        session.overall_score = total / len(session.feedback_list)
    
    def handle_rtc_offer(self, session_id: str, offer: Dict) -> Dict:
        """Handle WebRTC connection offer from candidate"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.rtc_offer = offer
        
        # Generate mock answer for testing (in production, this would be AI server)
        return {
            "status": "offer_received",
            "message": "WebRTC connection established",
            "session_id": session_id
        }
    
    def toggle_screen_share(self, session_id: str, enabled: bool) -> Dict:
        """Toggle screen sharing"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.screen_share_active = enabled
        
        return {
            "screen_share_active": enabled,
            "message": f"Screen share {'enabled' if enabled else 'disabled'}"
        }
    
    def end_interview(self, session_id: str) -> Dict:
        """End interview and generate comprehensive report"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.status = "completed"
        
        duration = (datetime.utcnow() - session.started_at).total_seconds() / 60
        
        return {
            "session_id": session_id,
            "role": session.role.value,
            "duration_minutes": int(duration),
            "questions_answered": len(session.answers),
            "total_questions": len(session.questions),
            "overall_score": round(session.overall_score, 1),
            "score_rating": self._rate_score(session.overall_score),
            "feedback_breakdown": session.feedback_list,
            "strengths": self._get_top_strengths(session),
            "improvements": self._get_improvements(session),
            "detailed_improvements": self._get_detailed_improvements(session),
            "recommendation": self._get_recommendation(session.overall_score),
            "next_steps": self._get_next_steps(session.overall_score)
        }
    
    def _rate_score(self, score: float) -> str:
        """Rate overall score"""
        if score >= 8.5:
            return "Excellent"
        elif score >= 7.5:
            return "Very Good"
        elif score >= 6.5:
            return "Good"
        elif score >= 5.5:
            return "Fair"
        else:
            return "Needs Improvement"
    
    def _get_top_strengths(self, session: InterviewSession) -> List[str]:
        """Extract top strengths"""
        all_strengths = []
        for feedback in session.feedback_list:
            all_strengths.extend(feedback.get("strengths", []))
        
        strength_counts = Counter(all_strengths)
        return [s for s, _ in strength_counts.most_common(3)]
    
    def _get_improvements(self, session: InterviewSession) -> List[str]:
        """Extract areas for improvement"""
        all_improvements = []
        for feedback in session.feedback_list:
            all_improvements.extend(feedback.get("improvements", []))
        
        improvement_counts = Counter(all_improvements)
        return [i for i, _ in improvement_counts.most_common(3)]
    
    def _get_detailed_improvements(self, session: InterviewSession) -> List[Dict]:
        """Extract detailed improvements with specific actions for each field"""
        all_detailed = []
        improvement_fields = {}
        
        # Aggregate detailed improvements by field
        for feedback in session.feedback_list:
            for detailed_imp in feedback.get("detailed_improvements", []):
                field = detailed_imp.get("field")
                if field:
                    if field not in improvement_fields:
                        improvement_fields[field] = detailed_imp
                    else:
                        # Merge actions if field appears multiple times
                        existing = improvement_fields[field]
                        existing["specific_actions"] = list(set(
                            existing.get("specific_actions", []) + 
                            detailed_imp.get("specific_actions", [])
                        ))
        
        # Convert to list and sort by importance
        field_priority = {
            "Technical Depth": 1,
            "Communication": 2,
            "Problem-Solving Approach": 3,
            "Examples & Confidence": 4
        }
        
        for field, details in improvement_fields.items():
            all_detailed.append(details)
        
        # Sort by priority
        all_detailed.sort(key=lambda x: field_priority.get(x.get("field"), 99))
        
        return all_detailed
    
    def _get_recommendation(self, score: float) -> str:
        """Generate recruitment recommendation"""
        if score >= 8:
            return "STRONG HIRE - Excellent technical depth and communication"
        elif score >= 7:
            return "HIRE - Very strong candidate with good potential"
        elif score >= 6:
            return "CONSIDER - Solid fundamentals, evaluate fit for role"
        elif score >= 5:
            return "MAYBE - Some concerns, additional preparation needed"
        else:
            return "PASS - Significant skill gaps to address"
    
    def _get_next_steps(self, score: float) -> List[str]:
        """Generate personalized next steps"""
        if score >= 8:
            return [
                "Ready for final interview",
                "Schedule with hiring manager",
                "Prepare for salary negotiation"
            ]
        elif score >= 7:
            return [
                "Proceed to next round",
                "Technical task assessment recommended",
                "Culture fit interview"
            ]
        elif score >= 6:
            return [
                "Conditional move forward dependent on experience",
                "Focus on [specific skills]",
                "Review recent projects"
            ]
        else:
            return [
                "Rebuild skills in core areas",
                "Study fundamentals",
                "Gain hands-on experience",
                "Consider re-interviewing in 3-6 months"
            ]

# Global instance
mock_interview_service = MockInterviewService()

