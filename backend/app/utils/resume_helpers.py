import json

def compile_resume_text(resume) -> str:
    """
    Constructs a plain-text representation of a built Resume model's sections
    (summary, skills, education, experience, projects, certifications)
    so that it can be used for ATS checks, search keyword matching, and AI recommendations.
    """
    parts = []
    
    if resume.title:
        parts.append(f"Title: {resume.title}")
        
    if resume.summary:
        parts.append(f"Professional Summary:\n{resume.summary}")
    
    # Skills
    if resume.parsed_skills:
        try:
            skills = json.loads(resume.parsed_skills)
            if isinstance(skills, list) and skills:
                parts.append("Skills: " + ", ".join(skills))
            elif isinstance(skills, str) and skills:
                parts.append(f"Skills: {skills}")
        except Exception:
            if isinstance(resume.parsed_skills, str) and resume.parsed_skills.strip():
                parts.append(f"Skills: {resume.parsed_skills.strip()}")
                
    # Experience
    if resume.parsed_experience:
        try:
            experience = json.loads(resume.parsed_experience)
            if isinstance(experience, list) and experience:
                parts.append("Work Experience:")
                for exp in experience:
                    company = exp.get('company') or exp.get('company_name') or ''
                    position = exp.get('position') or exp.get('job_title') or ''
                    start = exp.get('start_date') or ''
                    end = exp.get('end_date') or 'Present'
                    desc = exp.get('description') or ''
                    parts.append(f"- {position} at {company} ({start} - {end})\n{desc}")
        except Exception:
            pass

    # Education
    if resume.parsed_education:
        try:
            education = json.loads(resume.parsed_education)
            if isinstance(education, list) and education:
                parts.append("Education:")
                for edu in education:
                    school = edu.get('school') or edu.get('school_name') or ''
                    degree = edu.get('degree') or ''
                    field = edu.get('field_of_study') or edu.get('major') or ''
                    start = edu.get('start_date') or ''
                    end = edu.get('end_date') or ''
                    parts.append(f"- {degree} in {field} from {school} ({start} - {end})")
        except Exception:
            pass
            
    # Projects
    if resume.parsed_projects:
        try:
            projects = json.loads(resume.parsed_projects)
            if isinstance(projects, list) and projects:
                parts.append("Projects:")
                for proj in projects:
                    title = proj.get('title') or ''
                    desc = proj.get('description') or ''
                    tech = proj.get('technologies') or []
                    if isinstance(tech, list):
                        tech_str = ", ".join(tech)
                    else:
                        tech_str = str(tech)
                    parts.append(f"- {title} (Technologies: {tech_str})\n{desc}")
        except Exception:
            pass

    # Certifications
    if resume.parsed_certifications:
        try:
            certs = json.loads(resume.parsed_certifications)
            if isinstance(certs, list) and certs:
                names = [c.get('name') for c in certs if isinstance(c, dict) and c.get('name')]
                if names:
                    parts.append("Certifications: " + ", ".join(names))
        except Exception:
            pass
            
    return "\n\n".join(parts)
