from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import security_service
from app.models.job import JobListing
from app.models.user import User
from app.models.application import JobApplication, ApplicationStatus
from app.services.ai_service import get_ats_score, _rule_based_ats
from app.services.ats_analyzer import ats_analyzer
from app.services.adzuna import fetch_india_jobs
from pydantic import BaseModel
from typing import Optional, List
import datetime

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def ensure_user_resume_text(user: User, db: Session) -> str:
    """Ensures user.resume_text is populated, fallback to loading/compiling from current active Resume."""
    if user.resume_text:
        return user.resume_text
        
    from app.models.resume import Resume
    from app.utils.resume_helpers import compile_resume_text
    current_resume = db.query(Resume).filter(
        Resume.user_id == user.id,
        Resume.is_current == True
    ).first()
    
    if current_resume:
        if not current_resume.raw_text:
            current_resume.raw_text = compile_resume_text(current_resume)
        user.resume_text = current_resume.raw_text
        db.commit()
        return user.resume_text
        
    raise HTTPException(status_code=400, detail="Please upload your resume first")


@router.get("/search")
async def search_live_jobs(
    keyword: str = Query("Software Developer", description="Job search keyword"),
    location: str = Query("India", description="Location"),
    db: Session = Depends(get_db)
):
    """
    Search jobs in our database (which were populated by sync-live).
    """
    try:
        query = db.query(JobListing)
        
        if keyword:
            import re
            from sqlalchemy import or_
            keyword_normalized = re.sub(r'\s+', ' ', keyword.strip())
            
            # Case 1: OR Boolean logic (e.g. "React OR Python")
            if " or " in keyword_normalized.lower():
                terms = re.split(r'\s+or\s+', keyword_normalized, flags=re.IGNORECASE)
                filters = []
                for term in terms:
                    t = term.strip().lower()
                    if t:
                        filters.append(
                            (JobListing.title.ilike(f"%{t}%")) |
                            (JobListing.description.ilike(f"%{t}%")) |
                            (JobListing.company.ilike(f"%{t}%"))
                        )
                if filters:
                    query = query.filter(or_(*filters))
                    
            # Case 2: NOT Boolean logic (e.g. "Developer NOT Manager")
            elif " not " in keyword_normalized.lower():
                parts = re.split(r'\s+not\s+', keyword_normalized, maxsplit=1, flags=re.IGNORECASE)
                include_term = parts[0].strip().lower() if len(parts) > 0 else ""
                exclude_term = parts[1].strip().lower() if len(parts) > 1 else ""
                
                if include_term:
                    query = query.filter(
                        (JobListing.title.ilike(f"%{include_term}%")) |
                        (JobListing.description.ilike(f"%{include_term}%")) |
                        (JobListing.company.ilike(f"%{include_term}%"))
                    )
                if exclude_term:
                    query = query.filter(
                        ~JobListing.title.ilike(f"%{exclude_term}%"),
                        ~JobListing.description.ilike(f"%{exclude_term}%"),
                        ~JobListing.company.ilike(f"%{exclude_term}%")
                    )
                    
            # Case 3: AND Boolean logic (e.g. "React AND Python")
            elif " and " in keyword_normalized.lower():
                terms = re.split(r'\s+and\s+', keyword_normalized, flags=re.IGNORECASE)
                for term in terms:
                    t = term.strip().lower()
                    if t:
                        query = query.filter(
                            (JobListing.title.ilike(f"%{t}%")) |
                            (JobListing.description.ilike(f"%{t}%")) |
                            (JobListing.company.ilike(f"%{t}%"))
                        )
            else:
                # Default case (e.g. "Software Developer")
                keyword_lower = keyword_normalized.lower()
                query = query.filter(
                    (JobListing.title.ilike(f"%{keyword_lower}%")) |
                    (JobListing.description.ilike(f"%{keyword_lower}%")) |
                    (JobListing.company.ilike(f"%{keyword_lower}%"))
                )
            
        if location and location.lower() not in ["india", "remote"]:
            location_lower = location.lower()
            query = query.filter(JobListing.location.ilike(f"%{location_lower}%"))
            
        results = query.order_by(JobListing.created_at.desc()).limit(50).all()
        
        formatted_jobs = []
        for job in results:
            formatted_jobs.append({
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "description": job.description,
                "redirect_url": job.job_url,
                "url": job.job_url,
                "created": job.created_at.isoformat() if job.created_at else None,
                "source": job.source
            })
            
        return {
            "jobs": formatted_jobs,
            "total": len(formatted_jobs),
            "query": keyword,
            "location": location,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job search failed: {str(e)}")


# --- SCHEMAS ---
class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: str

class JobCreate(BaseModel):
    title: str
    description: str
    company: Optional[str] = None
    location: Optional[str] = None
    contact_email: Optional[str] = None
    is_scraped: bool = True  # Default to True for Extension data


class LiveSyncRequest(BaseModel):
    keyword: str = "Software Developer"
    location: str = "India"
    max_results: int = 30

# --- ENDPOINTS ---

@router.post("/analyze-resume")
async def analyze_resume(request: AnalysisRequest):
    """
    Analyzes resume against a job description.
    Called directly from the Chrome extension popup.
    """
    if not request.resume_text or not request.job_description:
        raise HTTPException(status_code=400, detail="Resume and job description are required")
    
    try:
        analysis = await get_ats_score(request.resume_text, request.job_description)
        return {
            "score": analysis["score"],
            "feedback": analysis["feedback"],
            "matched_skills": analysis["matched_skills"],
            "missing_skills": analysis["missing_skills"],
            "chart_data": analysis["chart_data"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/save-job")
async def save_job(job_data: JobCreate, db: Session = Depends(get_db)):
    """
    Receives job data from the Chrome Extension and saves it.
    This is the first step in the 'Placement Knowledge' flow.
    """
    new_job = JobListing(
        title=job_data.title,
        description=job_data.description,
        company=job_data.company or "Unknown Company",
        location=job_data.location or "Remote",
        contact_email=job_data.contact_email,
        is_scraped=True,
        source="extension",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"status": "success", "job_id": new_job.id}


@router.post("/sync-live")
async def sync_live_jobs_to_db(
    request: LiveSyncRequest,
    db: Session = Depends(get_db),
):
    """
    Pull live jobs from Adzuna, RemoteOK, and Arbeitnow and store them in PostgreSQL for matching.
    This powers profile-based recommendations without any demo dataset.
    """
    if request.max_results < 1 or request.max_results > 100:
        raise HTTPException(status_code=400, detail="max_results must be between 1 and 100")

    from app.services.job_aggregator import fetch_aggregated_jobs
    jobs = await fetch_aggregated_jobs(keyword=request.keyword, location=request.location)
    jobs = jobs[: request.max_results]

    created = 0
    skipped = 0

    for item in jobs:
        title = (item.get("title") or "").strip()
        company = (item.get("company") or "Unknown Company").strip()
        location = (item.get("location") or "Remote").strip()

        if not title:
            skipped += 1
            continue

        exists = db.query(JobListing).filter(
            JobListing.title == title,
            JobListing.company == company,
            JobListing.location == location,
        ).first()
        if exists:
            skipped += 1
            continue

        db.add(
            JobListing(
                title=title,
                company=company,
                location=location,
                description=item.get("description") or "",
                contact_email=None,
                is_scraped=True,
                source=item.get("source") or "aggregator",
                job_url=item.get("redirect_url") or item.get("url"),
                created_at=datetime.datetime.utcnow(),
            )
        )
        created += 1

    db.commit()

    return {
        "status": "success",
        "query": request.keyword,
        "location": request.location,
        "fetched": len(jobs),
        "created": created,
        "skipped": skipped,
    }


@router.post("/save-and-apply")
async def save_and_apply(
    job_data: JobCreate,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db)
):
    """
    One-click apply from Chrome Extension:
    1. Saves the job to database
    2. Applies to the job automatically
    3. Returns match score and application status
    
    Called from extension when user clicks "Apply"
    """
    # Check user has resume
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ensure_user_resume_text(user, db)
    
    # Save the job
    new_job = JobListing(
        title=job_data.title,
        description=job_data.description,
        company=job_data.company or "Unknown Company",
        location=job_data.location or "Remote",
        contact_email=job_data.contact_email,
        is_scraped=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_job)
    db.flush()  # Get the ID without committing yet
    
    # Check if already applied
    existing = db.query(JobApplication).filter(
        JobApplication.user_id == current_user_id,
        JobApplication.job_listing_id == new_job.id
    ).first()
    
    if existing:
        db.rollback()
        raise HTTPException(status_code=400, detail="You have already applied to this job")
    
    # Calculate match score
    try:
        analysis = await get_ats_score(user.resume_text, job_data.description or "")
        match_score = float(analysis.get("score", 0))
    except:
        match_score = 0.0
    
    # Create application
    application = JobApplication(
        user_id=current_user_id,
        job_listing_id=new_job.id,
        status=ApplicationStatus.APPLIED.value,
        ai_match_score=match_score,
        applied_at=datetime.datetime.utcnow()
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return {
        "status": "success",
        "message": "Applied successfully!",
        "job_id": new_job.id,
        "application_id": application.id,
        "job_title": new_job.title,
        "company": new_job.company,
        "location": new_job.location,
        "match_score": match_score,
        "match_status": "excellent" if match_score >= 75 else "good" if match_score >= 50 else "fair"
    }


@router.get("/user-analysis/{user_id}")
async def get_latest_analysis(user_id: int, db: Session = Depends(get_db)):
    """
    NEW: This is the 'Brain' of your dashboard.
    It fetches the latest job and returns the specific Skill Gaps.
    """
    # 1. Fetch User and Resume
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ensure_user_resume_text(user, db)

    # 2. Fetch the most recently scraped job
    latest_job = db.query(JobListing).order_by(JobListing.id.desc()).first()
    if not latest_job:
        raise HTTPException(status_code=404, detail="No job data found. Use the extension first.")

    # 3. Perform the 'Placement-Ready' AI Analysis
    # This calls your updated ai_service.py logic
    try:
        analysis = await get_ats_score(user.resume_text, latest_job.description or "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analysis error: {str(e)}")

    return {
        "job_details": {
            "title": latest_job.title,
            "company": latest_job.company,
            "location": latest_job.location
        },
        "ats_score": analysis["score"],
        "feedback": analysis["feedback"],
        "matched_skills": analysis["matched_skills"],
        "missing_skills": analysis["missing_skills"],
        "chart_data": analysis["chart_data"]
    }

@router.get("/recommendations")
async def get_my_recommendations(
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get personalized job recommendations for current user based on their resume.
    Fetches LIVE real-world jobs dynamically from the aggregator (Adzuna, RemoteOK, Arbeitnow) based on user's profile.
    """
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        resume_text = ensure_user_resume_text(user, db)
    except HTTPException:
        resume_text = ""
    
    # 1. Determine keyword search based on user profile
    search_keyword = "Software Developer"
    if user.preferred_roles and len(user.preferred_roles) > 0:
        search_keyword = user.preferred_roles[0]
    elif user.profession:
        search_keyword = user.profession
        
    # 2. Sync live jobs from aggregator dynamically
    try:
        from app.services.job_aggregator import fetch_aggregated_jobs
        live_jobs = await fetch_aggregated_jobs(keyword=search_keyword, location="India")
        
        # Save live jobs in DB
        for item in live_jobs:
            title = (item.get("title") or "").strip()
            company = (item.get("company") or "Unknown Company").strip()
            location = (item.get("location") or "Remote").strip()

            if not title:
                continue

            exists = db.query(JobListing).filter(
                JobListing.title == title,
                JobListing.company == company,
                JobListing.location == location,
            ).first()
            
            if not exists:
                db.add(
                    JobListing(
                        title=title,
                        company=company,
                        location=location,
                        description=item.get("description") or "",
                        is_scraped=True,
                        source=item.get("source") or "aggregator",
                        job_url=item.get("redirect_url") or item.get("url"),
                        created_at=datetime.datetime.utcnow(),
                    )
                )
        db.commit()
    except Exception as e:
        print(f"[RECOMMENDATIONS SYNC ERROR] Failed to fetch live jobs: {e}")
        # Continue with whatever we have in the DB if sync fails
        
    # 3. Pull latest 30 jobs matching the keyword or general listings
    keyword_like = f"%{search_keyword}%"
    jobs = db.query(JobListing).filter(
        (JobListing.title.ilike(keyword_like)) |
        (JobListing.description.ilike(keyword_like))
    ).order_by(JobListing.created_at.desc()).limit(30).all()
    
    # If not enough jobs, just pull latest 30 general jobs
    if len(jobs) < 5:
        jobs = db.query(JobListing).order_by(JobListing.created_at.desc()).limit(30).all()

    recommendations = []
    for job in jobs:
        jd = job.description or ""
        # Quick keyword overlap score
        resume_words = set(resume_text.lower().split())
        jd_words = set(w for w in jd.lower().split() if len(w) > 3)
        matched = resume_words & jd_words
        score = round((len(matched) / max(len(jd_words), 1)) * 100, 1)

        recommendations.append({
            "job_id": job.id,
            "title": job.title,
            "company": job.company or "Unknown",
            "location": job.location or "Remote",
            "description": jd,
            "score": min(score, 99),
            "redirect_url": job.job_url,
            "source": job.source
        })

    # Sort highest match first
    recommendations.sort(key=lambda x: x["score"], reverse=True)

    return {
        "recommendations": recommendations[:20],
        "total": len(recommendations),
        "resume_present": bool(resume_text),
        "user_skills": user.primary_skills or []
    }
@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: int, db: Session = Depends(get_db)):
    """Matches user resume against ALL jobs to find the top matches."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        ensure_user_resume_text(user, db)

        all_jobs = db.query(JobListing).all()
        if not all_jobs:
            return {"recommendations": [], "message": "No jobs found. Use the extension to scrape a job first."}

        recommendations = []
        for job in all_jobs:
            try:
                # Skip jobs with no description
                if not job.description:
                    continue
                    
                # We only need the score for the recommendation list
                analysis = _rule_based_ats(user.resume_text, job.description)
                recommendations.append({
                    "job_id": job.id,
                    "title": job.title,
                    "company": job.company or "Platform Partner",
                    "score": analysis["score"],
                    "missing_count": len(analysis["missing_skills"])
                })
            except Exception as e:
                print(f"Error analyzing job {job.id}: {str(e)}")
                continue

        # Sort by Match Score (Highest first)
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return {
            "recommendations": recommendations[:5],
            "total_analyzed": len(recommendations)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Recommendations endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {str(e)}")


@router.post("/bulk-apply")
async def bulk_apply(user_id: int, domain: str, db: Session = Depends(get_db)):
    """Segment A compatibility endpoint for extension bulk-apply flow."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not domain.strip():
        raise HTTPException(status_code=400, detail="Domain is required")

    domain_lower = domain.lower()
    matched_jobs = (
        db.query(JobListing)
        .filter(
            (JobListing.title.ilike(f"%{domain_lower}%"))
            | (JobListing.description.ilike(f"%{domain_lower}%"))
        )
        .limit(20)
        .all()
    )

    return {
        "message": f"Prepared {len(matched_jobs)} matching jobs for assisted apply in '{domain}'.",
        "user_id": user_id,
        "domain": domain,
        "matched_job_ids": [job.id for job in matched_jobs],
    }


# ========== SEGMENT E: SKILL GAP ANALYSIS ==========

@router.get("/skill-gap/{job_id}")
async def get_skill_gap(
    job_id: int,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get detailed skill gap analysis for a specific job.
    Shows matched skills, missing skills, and learning resources.
    """
    # Get user and job
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ensure_user_resume_text(user, db)
    
    job = db.query(JobListing).filter(JobListing.id == job_id).first()
    if not job or not job.description:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Calculate detailed skill gaps dynamically
    dynamic_report = await ats_analyzer.analyze_resume_dynamic(
        user.resume_text,
        job.description,
        years_of_experience=user.years_of_experience,
        preferred_roles=user.preferred_roles
    )
    
    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location
        },
        "overall_match_percentage": dynamic_report["overall_match_percentage"],
        "overall_match": dynamic_report["overall_match_percentage"],
        "category_gaps": dynamic_report["category_gaps"],
        "priority_skills": dynamic_report["priority_skills"],
        "matched_keywords": dynamic_report["matched_keywords"],
        "matched_skills": dynamic_report["matched_keywords"],
        "missing_keywords": dynamic_report["missing_keywords"],
        "missing_skills": dynamic_report["missing_keywords"],
        "learning_path": dynamic_report["learning_path"]
    }


@router.post("/analyze-resume-vs-job")
async def analyze_resume_vs_job(
    request: AnalysisRequest,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Analyze a resume against any job description.
    Returns detailed skill gaps, match percentage, and recommendations.
    """
    if not request.resume_text or not request.job_description:
        raise HTTPException(status_code=400, detail="Resume and job description are required")
    
    user = db.query(User).filter(User.id == current_user_id).first()
    years_of_experience = user.years_of_experience if user else None
    preferred_roles = user.preferred_roles if user else None
    
    try:
        dynamic_report = await ats_analyzer.analyze_resume_dynamic(
            request.resume_text,
            request.job_description,
            years_of_experience=years_of_experience,
            preferred_roles=preferred_roles
        )
        formatting = ats_analyzer.check_formatting_compliance(request.resume_text)
        
        return {
            "overall_match_percentage": dynamic_report["overall_match_percentage"],
            "overall_match": dynamic_report["overall_match_percentage"],
            "matched_skills": dynamic_report["matched_keywords"],
            "matched_keywords": dynamic_report["matched_keywords"],
            "missing_skills": dynamic_report["missing_keywords"],
            "missing_keywords": dynamic_report["missing_keywords"],
            "category_analysis": dynamic_report["category_gaps"],
            "category_gaps": dynamic_report["category_gaps"],
            "priority_skills": dynamic_report["priority_skills"],
            "ats_score": dynamic_report["overall_match_percentage"],
            "formatting_compliant": formatting["is_ats_compliant"],
            "formatting_issues": formatting["issues"],
            "learning_path": dynamic_report["learning_path"],
            "recommendation": {
                "status": "excellent" if dynamic_report["overall_match_percentage"] >= 75 else "good" if dynamic_report["overall_match_percentage"] >= 50 else "needs improvement",
                "message": f"Your profile matches {dynamic_report['overall_match_percentage']}% of required skills"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/improvement-resources/{job_id}")
async def get_improvement_resources(
    job_id: int,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get personalized learning resources to bridge skill gaps for a job.
    """
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ensure_user_resume_text(user, db)
    
    job = db.query(JobListing).filter(JobListing.id == job_id).first()
    if not job or not job.description:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get learning resources dynamically
    dynamic_report = await ats_analyzer.analyze_resume_dynamic(
        user.resume_text,
        job.description,
        years_of_experience=user.years_of_experience,
        preferred_roles=user.preferred_roles
    )
    priority_skills = dynamic_report["priority_skills"]
    learning_path = dynamic_report["learning_path"]
    
    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "company": job.company
        },
        "priority_skills": priority_skills,
        "learning_resources": learning_path.get("resources", {}),
        "total_training_hours": learning_path.get("total_hours", 0),
        "estimated_weeks": learning_path.get("estimated_weeks", 0),
        "recommendation": learning_path.get("recommendation", ""),
        "action_plan": [
            f"Week 1-{learning_path.get('estimated_weeks', 2)}: Learn {', '.join(priority_skills[:3])}",
            "Practice with real projects",
            "Update resume with new skills",
            f"Reapply to this job after {learning_path.get('estimated_weeks', 2)} weeks"
        ]
    }


@router.get("/skill-analysis")
async def get_skill_analysis(
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get overall skill analysis for the user based on all recommended jobs.
    Shows strengths, gaps, and recommendations.
    """
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ensure_user_resume_text(user, db)
    
    all_jobs = db.query(JobListing).all()
    if not all_jobs:
        return {"analysis": None, "message": "No jobs available for analysis"}
    
    # Analyze against all jobs
    all_gaps = {}
    max_gaps = {}
    
    for job in all_jobs[:20]:  # Analyze top 20 jobs
        if not job.description:
            continue
        
        dynamic_report = await ats_analyzer.analyze_resume_dynamic(
            user.resume_text,
            job.description,
            years_of_experience=user.years_of_experience,
            preferred_roles=user.preferred_roles
        )
        category_gaps = dynamic_report["category_gaps"]
        
        # Track which skills appear most frequently in job descriptions
        for category, gap_info in category_gaps.items():
            if category not in max_gaps:
                max_gaps[category] = {"gap": 0, "missing": []}
            
            if gap_info["gap_percentage"] > max_gaps[category]["gap"]:
                max_gaps[category]["gap"] = gap_info["gap_percentage"]
                max_gaps[category]["missing"] = gap_info["you_need"]
    
    return {
        "user_skills": user.primary_skills or [],
        "overall_skill_gaps": max_gaps,
        "most_needed_skills": list(set([skill for cat in max_gaps.values() for skill in cat["missing"]]))[:5],
        "jobs_analyzed": min(20, len(all_jobs)),
        "recommendation": "Focus on learning the most needed skills to improve your job match across all opportunities"
    }