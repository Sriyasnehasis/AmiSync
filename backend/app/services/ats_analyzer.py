"""
ATS Analyzer - Enhanced skill gap analysis and ATS scoring
"""
from typing import List, Dict, Any
import json
import re

class ATSAnalyzer:
    """Service to analyze resumes for ATS compatibility and skill gaps"""
    
    # Skill categories for comprehensive analysis
    SKILL_CATEGORIES = {
        "Frontend": ["react", "javascript", "js", "next.js", "nextjs", "html", "css", "tailwind", "typescript", "ts", "vue", "angular", "svelte"],
        "Backend": ["fastapi", "python", "docker", "node", "nodejs", "django", "flask", "golang", "rust", "java", "spring", "express"],
        "Database": ["postgresql", "postgres", "mongodb", "mongo", "sql", "redis", "firebase", "mysql", "nosql", "elasticsearch"],
        "Cloud": ["aws", "docker", "kubernetes", "k8s", "azure", "gcp", "terraform", "devops", "ci/cd"],
        "AI_ML": ["machine learning", "ml", "ai", "pytorch", "tensorflow", "nlp", "scikit-learn", "pandas", "numpy", "openai"],
        "DevOps": ["docker", "kubernetes", "jenkins", "gitlab", "github", "ansible", "terraform", "aws", "ci/cd"],
        "Mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android"],
    }
    
    @classmethod
    async def analyze_resume_dynamic(
        cls,
        resume_text: str,
        job_description: str,
        years_of_experience: float = None,
        preferred_roles: List[str] = None
    ) -> Dict[str, Any]:
        """
        Dynamically analyze resume against a job description using Gemini AI.
        Groups skills into context-aware categories and matches them.
        """
        from app.services.ai_service import _call_ai, GEMINI_AVAILABLE, GROQ_AVAILABLE, OPENROUTER_AVAILABLE
        from app.services.ai_service import _rule_based_ats
        
        if not resume_text or not job_description:
            return {
                "overall_match_percentage": 0,
                "matched_keywords": [],
                "missing_keywords": [],
                "category_gaps": {},
                "priority_skills": [],
                "learning_path": {"resources": {}, "total_hours": 0, "estimated_weeks": 0, "recommendation": ""}
            }
            
        # Fallback to rule-based analysis if AI APIs are offline
        if not (GEMINI_AVAILABLE or GROQ_AVAILABLE or OPENROUTER_AVAILABLE):
            rule_based = _rule_based_ats(resume_text, job_description)
            # Adapt schema to match
            category_gaps = {}
            for cat, pct in rule_based.get("chart_data", {}).items():
                category_gaps[cat] = {
                    "job_requires": [cat.lower()],
                    "you_have": [cat.lower()] if pct > 0 else [],
                    "you_need": [] if pct > 0 else [cat.lower()],
                    "gap_percentage": 100 - pct,
                    "match_percentage": pct
                }
            return {
                "overall_match_percentage": rule_based["score"],
                "matched_keywords": rule_based["matched_skills"],
                "missing_keywords": rule_based["missing_skills"],
                "category_gaps": category_gaps,
                "priority_skills": rule_based["missing_skills"][:3],
                "learning_path": {"resources": {}, "total_hours": 0, "estimated_weeks": 0, "recommendation": ""}
            }
            
        experience_info = ""
        if years_of_experience is not None:
            level = "Junior (0-2 years)"
            if years_of_experience >= 6.0:
                level = "Senior (6+ years)"
            elif years_of_experience >= 3.0:
                level = "Mid-Level (3-5 years)"
            experience_info = f"\nCandidate's Target Seniority Level: {level} ({years_of_experience} years of experience)\n"

        roles_info = ""
        if preferred_roles:
            roles_info = f"Candidate's Preferred Roles: {', '.join(preferred_roles)}\n"

        prompt = f"""You are an expert technical recruiter and resume parser.
Analyze the candidate's resume against the job description below.
{experience_info}{roles_info}
JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME:
{resume_text}

CRITICAL INSTRUCTION FOR SCORING & RECOMMENDATION:
Tailor the evaluation, scoring, gap analysis, and recommendations specifically to the candidate's Target Seniority Level.
- If the Target Seniority Level is Junior: Evaluate them relative to entry-level/junior expectations. Do not penalize them for lacking advanced leadership, complex system architecture design, or extensive years of specialization. Focus on their core foundational skills, quick learning ability, hands-on coding, and matching the baseline requirements.
- If the Target Seniority Level is Senior: Evaluate them strictly. Check for senior-level responsibilities like system design, architecture, project leading, mentorship, and high-level domain expertise.
- Adjust the `overall_match_percentage` to reflect how well their resume qualifies them *for their experience level* for this job.

Analyze the skills required for the job and match them against the candidate's resume.
1. Group the extracted skills into 3-5 logical categories (e.g. Core Domain Skills, Software & Tools, Soft Skills, Leadership & Management, etc.) that are contextual and highly relevant to this specific job.
2. For each category:
   - Identify the skills required by the job.
   - Identify which of those skills the candidate already has in their resume.
   - Identify which of those skills the candidate is missing.
   - Compute the gap percentage (missing count / required count * 100).
3. Compute an overall match percentage (0-100) based on all matched vs required skills.
4. List the top 3-5 priority skills the candidate needs to learn to bridge the gaps.
5. Create a mini learning path with estimated learning hours and online course recommendation.

Format the response in JSON with exactly this structure:
{{
  "overall_match_percentage": <int 0-100>,
  "matched_keywords": ["skill1", "skill2", ...],
  "missing_keywords": ["skill3", "skill4", ...],
  "category_gaps": {{
    "Category Name (e.g., Domain Expertise)": {{
      "job_requires": ["skill1", "skill3"],
      "you_have": ["skill1"],
      "you_need": ["skill3"],
      "gap_percentage": 50,
      "match_percentage": 50
    }},
    ...
  }},
  "priority_skills": ["skill3", ...],
  "learning_path": {{
    "resources": {{
      "skill3": {{
        "platform": "Online Course",
        "hours": 10,
        "url": "https://www.coursera.org"
      }}
    }},
    "total_hours": <int hours>,
    "estimated_weeks": <int weeks>,
    "recommendation": "<1 sentence overall recommendation>"
  }}
}}

Return ONLY valid JSON. Do not write any markdown blocks (like ```json) or extra text.
"""
        try:
            result = await _call_ai(prompt, expect_json=True)
            if isinstance(result, dict) and "overall_match_percentage" in result:
                return result
        except Exception as e:
            print(f"[AI ATS ANALYZER ERROR] Dynamic analysis failed: {e}")
            
        # Graceful fallback to rule-based if anything goes wrong
        rule_based = _rule_based_ats(resume_text, job_description)
        category_gaps = {}
        for cat, pct in rule_based.get("chart_data", {}).items():
            category_gaps[cat] = {
                "job_requires": [cat.lower()],
                "you_have": [cat.lower()] if pct > 0 else [],
                "you_need": [] if pct > 0 else [cat.lower()],
                "gap_percentage": 100 - pct,
                "match_percentage": pct
            }
        return {
            "overall_match_percentage": rule_based["score"],
            "matched_keywords": rule_based["matched_skills"],
            "missing_keywords": rule_based["missing_skills"],
            "category_gaps": category_gaps,
            "priority_skills": rule_based["missing_skills"][:3],
            "learning_path": {"resources": {}, "total_hours": 0, "estimated_weeks": 0, "recommendation": ""}
        }

    @staticmethod
    def analyze_resume(
        resume_text: str,
        job_description: str = None
    ) -> Dict[str, Any]:
        """
        Comprehensive resume analysis with skill gaps
        """
        if not resume_text:
            return {"ats_score": 0, "feedback": [], "keywords_found": [], "keywords_missing": [], "formatting_issues": [], "suggestions": []}
        
        # Normalize text
        resume_lower = resume_text.lower()
        job_lower = job_description.lower() if job_description else ""
        
        # Extract skills from resume
        resume_skills = ATSAnalyzer._extract_skills(resume_lower)
        
        # If we have job description, compare
        if job_description:
            job_skills = ATSAnalyzer._extract_skills(job_lower)
            matched = [s for s in job_skills if s in resume_skills]
            missing = [s for s in job_skills if s not in resume_skills]
            match_score = int((len(matched) / len(job_skills) * 100)) if job_skills else 0
        else:
            matched = []
            missing = []
            match_score = 50
        
        # Check formatting compliance
        formatting_issues = ATSAnalyzer.check_formatting_compliance(resume_text)
        
        # Generate suggestions
        suggestions = ATSAnalyzer.generate_ats_improvement_suggestions(missing, match_score)
        
        return {
            "ats_score": match_score,
            "feedback": [f"Found {len(matched)} matching skills"] if matched else ["No skill matches found"],
            "keywords_found": matched,
            "keywords_missing": missing,
            "formatting_issues": formatting_issues["issues"],
            "suggestions": suggestions
        }
    
    @staticmethod
    def extract_keywords_from_job(job_description: str) -> List[str]:
        """Extract important keywords from job description"""
        if not job_description:
            return []
        
        keywords = []
        job_lower = job_description.lower()
        
        # Extract all skills mentioned
        for category, skills in ATSAnalyzer.SKILL_CATEGORIES.items():
            for skill in skills:
                if skill in job_lower:
                    keywords.append(skill)
        
        # Extract educational requirements
        edu_keywords = ["bachelor", "master", "phd", "degree", "certification"]
        for edu in edu_keywords:
            if edu in job_lower:
                keywords.append(edu)
        
        return list(set(keywords))  # Remove duplicates
    
    @staticmethod
    def check_formatting_compliance(resume_text: str) -> Dict[str, Any]:
        """
        Check if resume meets ATS formatting requirements
        """
        issues = []
        compliance_score = 100
        
        # Check for proper sections
        required_sections = ["education", "experience", "about", "skills"]
        for section in required_sections:
            if section not in resume_text.lower():
                issues.append(f"Missing '{section}' section")
                compliance_score -= 10
        
        # Check for problematic characters
        if any(char in resume_text for char in ["📌", "🎯", "✨"]):
            issues.append("Remove emoji - ATS systems may not parse them")
            compliance_score -= 5
        
        # Check length
        if len(resume_text.strip()) < 300:
            issues.append("Resume seems too short - add more details")
            compliance_score -= 10
        elif len(resume_text.strip()) > 5000:
            issues.append("Resume seems too long - try to condense")
            compliance_score -= 5
        
        return {
            "is_ats_compliant": compliance_score >= 80,
            "issues": issues,
            "compliance_score": max(0, compliance_score)
        }
    
    @staticmethod
    def calculate_keyword_match(
        resume_text: str,
        job_description: str
    ) -> Dict[str, Any]:
        """Calculate keyword match percentage between resume and job"""
        if not resume_text or not job_description:
            return {"match_percentage": 0, "matched_keywords": [], "missing_keywords": []}
        
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Extract skills from job
        job_skills = ATSAnalyzer._extract_skills(job_lower)
        
        # Check which are in resume
        matched = [skill for skill in job_skills if skill in resume_lower]
        missing = [skill for skill in job_skills if skill not in resume_lower]
        
        match_percentage = int((len(matched) / len(job_skills) * 100)) if job_skills else 0
        
        return {
            "match_percentage": match_percentage,
            "matched_keywords": matched,
            "missing_keywords": missing,
            "total_required_skills": len(job_skills),
            "matched_count": len(matched)
        }
    
    @staticmethod
    def calculate_skill_gaps(
        resume_text: str,
        job_description: str
    ) -> Dict[str, Any]:
        """
        Calculate detailed skill gaps per category
        """
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        gaps = {}
        
        for category, skills in ATSAnalyzer.SKILL_CATEGORIES.items():
            resume_skills_in_cat = [s for s in skills if s in resume_lower]
            job_skills_in_cat = [s for s in skills if s in job_lower]
            
            missing_in_cat = [s for s in job_skills_in_cat if s not in resume_lower]
            
            gap_percentage = 0
            if job_skills_in_cat:
                gap_percentage = int((len(missing_in_cat) / len(job_skills_in_cat)) * 100)
            
            gaps[category] = {
                "job_requires": job_skills_in_cat,
                "you_have": resume_skills_in_cat,
                "you_need": missing_in_cat,
                "gap_percentage": gap_percentage,
                "match_percentage": 100 - gap_percentage if job_skills_in_cat else 0
            }
        
        return {
            "category_gaps": gaps,
            "priority_skills": ATSAnalyzer._identify_priority_skills(gaps),
            "ats_score": ATSAnalyzer._calculate_overall_score(gaps)
        }
    
    @staticmethod
    def generate_ats_improvement_suggestions(
        missing_keywords: List[str] = None,
        match_score: int = 0
    ) -> List[str]:
        """Generate specific suggestions to improve ATS score"""
        suggestions = []
        
        if match_score < 50:
            suggestions.append("⚠️ Major skill gap detected. Consider adding key required skills.")
        elif match_score < 75:
            suggestions.append("Your skills are moderately aligned. Add missing technologies to improve match.")
        
        if missing_keywords:
            if len(missing_keywords) > 0:
                suggestions.append(f"Priority: Add '{missing_keywords[0]}' to your resume")
            if len(missing_keywords) > 1:
                suggestions.append(f"Also mention: '{missing_keywords[1]}' if you have experience")
        
        suggestions.append("✅ Use keywords from job description in your resume")
        suggestions.append("✅ Replace bullet points with specific metric results")
        
        return suggestions
    
    @staticmethod
    def generate_learning_path(missing_skills: List[str]) -> Dict[str, Any]:
        """
        Generate learning resources and timeline for missing skills
        """
        resources = {}
        
        skill_resources = {
            "react": {"platform": "freeCodeCamp", "hours": 15, "url": "https://www.freecodecamp.org/learn/front-end-development-libraries/react/"},
            "python": {"platform": "Codecademy", "hours": 10, "url": "https://www.codecademy.com/learn/learn-python-3"},
            "docker": {"platform": "DigitalOcean", "hours": 8, "url": "https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-20-04"},
            "fastapi": {"platform": "FastAPI Docs", "hours": 12, "url": "https://fastapi.tiangolo.com/"},
            "mongodb": {"platform": "MongoDB University", "hours": 6, "url": "https://university.mongodb.com/"},
            "postgresql": {"platform": "PostgreSQL Docs", "hours": 8, "url": "https://www.postgresql.org/docs/"},
            "kubernetes": {"platform": "Linux Foundation", "hours": 20, "url": "https://www.linux.com/training/"},
        }
        
        total_hours = 0
        for skill in missing_skills[:5]:  # Top 5 missing skills
            skill_lower = skill.lower()
            if skill_lower in skill_resources:
                resources[skill] = skill_resources[skill_lower]
                total_hours += skill_resources[skill_lower]["hours"]
        
        # Estimate weeks (assuming 10 hours/week learning)
        estimated_weeks = max(1, total_hours // 10)
        
        return {
            "resources": resources,
            "total_hours": total_hours,
            "estimated_weeks": estimated_weeks,
            "recommendation": f"You can learn these skills in ~{estimated_weeks} weeks with consistent effort"
        }
    
    @staticmethod
    def _extract_skills(text: str) -> List[str]:
        """Helper to extract all skills from text"""
        skills = []
        text_lower = text.lower()
        
        for category, skill_list in ATSAnalyzer.SKILL_CATEGORIES.items():
            for skill in skill_list:
                if skill in text_lower:
                    skills.append(skill)
        
        return list(set(skills))  # Remove duplicates
    
    @staticmethod
    def _identify_priority_skills(gaps: Dict) -> List[str]:
        """Identify which skills to prioritize learning"""
        priority = []
        
        for category, gap_info in gaps.items():
            if gap_info["gap_percentage"] > 50 and gap_info["you_need"]:
                # High gap in this category
                priority.extend(gap_info["you_need"][:2])  # Top 2 skills per category
        
        return priority[:5]  # Return top 5 priorities
    
    @staticmethod
    def _calculate_overall_score(gaps: Dict) -> int:
        """Calculate overall ATS score from category gaps"""
        if not gaps:
            return 0
        
        total_match = sum(gap_info["match_percentage"] for gap_info in gaps.values())
        return int(total_match / len(gaps))


# Singleton instance
ats_analyzer = ATSAnalyzer()
