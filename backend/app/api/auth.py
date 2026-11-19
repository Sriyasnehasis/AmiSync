import httpx
import os
import asyncio
import io
import sys
from typing import Optional
from urllib.parse import urlencode

import pdfplumber
from docx import Document
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import security_service
from app.core.config import settings
from app.models.user import User
from app.schemas import UserSignUp, UserLogin, TokenResponse, UserResponse



def seed_initial_user_data(db: Session, user_id: int):
    """Automatically populate 5 default jobs, 1 mock HR contact, and 1 template for a cold start fix."""
    from app.models.job import JobListing
    from app.models.hr_contact import HRContact, EmailTemplate

    # 1. Seed jobs (only if there are 0 jobs in the database)
    if db.query(JobListing).count() == 0:
        default_jobs = [
            JobListing(
                title="Frontend Developer",
                company="Google",
                location="Mountain View, CA",
                description="Looking for a Frontend Developer with React, TypeScript, and TailwindCSS skills. You will work on designing scalable interfaces and collaborating with product teams.",
                contact_email="careers@google.com",
                is_scraped=True,
                source="LinkedIn"
            ),
            JobListing(
                title="Backend Software Engineer",
                company="Netflix",
                location="Los Gatos, CA",
                description="Seeking a Backend Engineer proficient in Python, FastAPI, PostgreSQL, and Docker. Experience with microservices and AWS deployment is highly desired.",
                contact_email="jobs@netflix.com",
                is_scraped=True,
                source="LinkedIn"
            ),
            JobListing(
                title="DevOps & Infrastructure Engineer",
                company="Stripe",
                location="San Francisco, CA",
                description="Join our DevOps team to manage Kubernetes clusters, build CI/CD pipelines using GitHub Actions, and automate infrastructure using Terraform.",
                contact_email="recruiting@stripe.com",
                is_scraped=True,
                source="LinkedIn"
            ),
            JobListing(
                title="Data Scientist / Analyst",
                company="Airbnb",
                location="San Francisco, CA",
                description="We are looking for a Data Scientist to build predictive models, run A/B testing experiments, and perform data analysis using SQL and pandas.",
                contact_email="hiring@airbnb.com",
                is_scraped=True,
                source="LinkedIn"
            ),
            JobListing(
                title="Product Manager",
                company="Uber",
                location="San Francisco, CA",
                description="Uber is seeking a Product Manager to lead feature prioritization, write strategy roadmaps, and define user-centric product requirements.",
                contact_email="pm-hiring@uber.com",
                is_scraped=True,
                source="LinkedIn"
            )
        ]
        db.add_all(default_jobs)
        db.commit()

    # 2. Seed 1 mock HR contact for outreach tracking
    if db.query(HRContact).filter(HRContact.user_id == user_id).count() == 0:
        mock_hr = HRContact(
            user_id=user_id,
            first_name="Sarah",
            last_name="Jenkins",
            email="sarah.jenkins@google.com",
            phone="+1 (555) 019-2834",
            company_name="Google",
            job_title="Lead Talent Acquisition Partner",
            department="Recruiting",
            status="new",
            source="LinkedIn",
            notes="Connected with Sarah on LinkedIn. She recruits for frontend and engineering roles."
        )
        db.add(mock_hr)
        db.commit()

    # 3. Seed 1 default email outreach template
    if db.query(EmailTemplate).filter(EmailTemplate.user_id == user_id).count() == 0:
        default_template = EmailTemplate(
            user_id=user_id,
            name="Cold Job Inquiry",
            subject="Inquiry: Opportunities at {company} - {full_name}",
            body="Dear {first_name},\n\nI hope you are doing well.\n\nMy name is {full_name}, and I am a {profession} with a strong background in {skills}. I have been following {company}'s growth and would love to explore how my skills could support your recruiting goals.\n\nI've attached my resume and would welcome the opportunity to chat briefly.\n\nBest regards,\n{full_name}",
            template_type="job_inquiry",
            is_active=True
        )
        db.add(default_template)
        db.commit()

load_dotenv()
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/test")
def test_endpoint(data: dict):
    """Simple test endpoint"""
    return {"status": "ok", "received": data}


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ==================== EMAIL/PASSWORD AUTH ====================

@router.post("/signup", response_model=TokenResponse)
def signup(payload: UserSignUp, db: Session = Depends(get_db)):
    try:
        print(f"[Signup] Received email: {payload.email}")
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )

        password_hash = security_service.hash_password(payload.password)
        print(f"[Signup] Password hashed successfully")

        user = User(
            email=payload.email,
            password_hash=password_hash,
            full_name=payload.full_name,
            phone=payload.phone,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[Signup] User created with ID: {user.id}")
        try:
            seed_initial_user_data(db, user.id)
            print(f"[Signup] Seeded initial data for user {user.id}")
        except Exception as seed_err:
            print(f"[Signup] Seed error: {seed_err}")

        access_token = security_service.create_access_token({"sub": str(user.id)})
        refresh_token = security_service.create_refresh_token({"sub": str(user.id)})
        print(f"[Signup] Tokens created successfully")

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Signup] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Signup failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    try:
        print(f"[Login] Attempting login for email: {payload.email}")
        user: Optional[User] = db.query(User).filter(User.email == payload.email).first()
        if not user or not user.password_hash:
            print(f"[Login] User not found or no password hash")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not security_service.verify_password(payload.password, user.password_hash):
            print(f"[Login] Password verification failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        print(f"[Login] Password verified successfully")
        access_token = security_service.create_access_token({"sub": str(user.id)})
        refresh_token = security_service.create_refresh_token({"sub": str(user.id)})
        print(f"[Login] Tokens created successfully")

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Login] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        token_data = security_service.verify_token(payload.refresh_token)
    except HTTPException:
        # verify_token already raises a 401; just re-raise
        raise

    user_id = token_data.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user: Optional[User] = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User inactive or not found",
        )

    access_token = security_service.create_access_token({"sub": str(user.id)})
    refresh_token = security_service.create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db),
):
    user: Optional[User] = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


# ==================== GITHUB & GOOGLE OAUTH ====================

DEFAULT_GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
DEFAULT_GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")

def get_github_client_id() -> str:
    return os.getenv("GITHUB_CLIENT_ID", "")

def get_github_client_secret() -> str:
    return os.getenv("GITHUB_CLIENT_SECRET", "")

GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/github-callback")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback"
)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _oauth_success_redirect(user: User) -> RedirectResponse:
    access_token = security_service.create_access_token({"sub": str(user.id)})
    refresh_token = security_service.create_refresh_token({"sub": str(user.id)})
    params = urlencode(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )
    return RedirectResponse(f"{FRONTEND_URL}/auth/oauth-callback?{params}")


async def _process_github_code(code: str, db: Session, redirect_uri: Optional[str] = None) -> User:
    client_id = get_github_client_id()
    client_secret = get_github_client_secret()
    target_redirect = (
        redirect_uri
        or os.getenv("GITHUB_REDIRECT_URI")
        or f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/github-callback"
    )

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth credentials are not configured",
        )

    async with httpx.AsyncClient() as client:
        token_payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
        }
        if target_redirect:
            token_payload["redirect_uri"] = target_redirect

        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            data=token_payload,
            headers={"Accept": "application/json"},
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")

        if not access_token:
            err_desc = (
                token_data.get("error_description")
                or token_data.get("error")
                or "Failed to retrieve GitHub access token"
            )
            print(f"[GitHub OAuth] Token exchange error: {token_data}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub token exchange error: {err_desc}",
            )

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "User-Agent": "AmiSync-App",
        }
        user_res = await client.get("https://api.github.com/user", headers=headers)
        if not user_res.is_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch GitHub profile",
            )
        profile = user_res.json()
        github_id = str(profile.get("id"))
        github_username = profile.get("login")

        # Fetch verified primary email
        email = profile.get("email")
        if not email:
            emails_res = await client.get(
                "https://api.github.com/user/emails", headers=headers
            )
            if emails_res.is_success:
                emails = emails_res.json()
                primary = next(
                    (e for e in emails if e.get("primary") and e.get("verified")),
                    None,
                )
                fallback = next((e for e in emails if e.get("verified")), None)
                email = (primary or fallback or {}).get("email")

        if not email:
            login = profile.get("login", f"user-{github_id}")
            email = f"{login}@users.noreply.github.com"

        # Lookup existing user by github_id first, then email
        user = None
        if github_id:
            user = db.query(User).filter(User.github_id == github_id).first()
        if not user:
            user = db.query(User).filter(User.email == email).first()

        full_name = profile.get("name") or github_username or "AmiSync User"
        avatar_url = profile.get("avatar_url")
        html_url = profile.get("html_url") or f"https://github.com/{github_username}"
        bio = profile.get("bio")

        if not user:
            user = User(
                email=email,
                full_name=full_name,
                username=github_username,
                github_id=github_id,
                github_username=github_username,
                github_access_token=access_token,
                github_avatar_url=avatar_url,
                github_profile_url=html_url,
                github_bio=bio,
                profile_pic_url=avatar_url,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
        else:
            user.github_id = github_id
            user.github_username = github_username
            user.github_access_token = access_token
            user.github_avatar_url = avatar_url
            user.github_profile_url = html_url
            if bio and not user.bio:
                user.bio = bio
            if not user.profile_pic_url:
                user.profile_pic_url = avatar_url
            if not user.full_name:
                user.full_name = full_name
            user.is_verified = True

        db.commit()
        db.refresh(user)

        try:
            seed_initial_user_data(db, user.id)
        except Exception as seed_err:
            print(f"[OAuth Seed Error] {seed_err}")

        # Background sync of repos/languages
        async def _bg_sync(user_id: int):
            from app.core.db import SessionLocal
            from app.services.github_service import GitHubDataService
            bg_db = SessionLocal()
            try:
                bg_user = bg_db.query(User).filter(User.id == user_id).first()
                if bg_user:
                    await GitHubDataService.sync_github_data(bg_user, bg_db)
            except Exception as sync_err:
                print(f"[OAuth GitHub Sync Warning] {sync_err}")
            finally:
                bg_db.close()

        try:
            asyncio.create_task(_bg_sync(user.id))
        except Exception as sync_launch_err:
            print(f"[OAuth GitHub Sync Launch Error] {sync_launch_err}")

        return user


@router.get("/github/login")
async def github_login(state: Optional[str] = "login", redirect_uri: Optional[str] = None):
    """Step 1: Send user to GitHub to ask for authorization."""
    client_id = get_github_client_id()
    target_redirect = (
        redirect_uri
        or os.getenv("GITHUB_REDIRECT_URI")
        or f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/github-callback"
    )

    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth is not configured",
        )

    params = {
        "client_id": client_id,
        "redirect_uri": target_redirect,
        "scope": "read:user user:email repo",
        "state": state or "login",
        "allow_signup": "true",
    }
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{urlencode(params)}")


@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    """Direct backend callback handler: exchange code and redirect to frontend with JWT."""
    user = await _process_github_code(code, db)
    return _oauth_success_redirect(user)


class GitHubDirectLoginRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


@router.post("/github/direct-login")
async def github_direct_login(
    payload: GitHubDirectLoginRequest,
    db: Session = Depends(get_db)
):
    """Frontend-mediated direct login/signup with GitHub code."""
    user = await _process_github_code(payload.code, db, redirect_uri=payload.redirect_uri)
    access_token = security_service.create_access_token({"sub": str(user.id)})
    refresh_token = security_service.create_refresh_token({"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "profession": user.profession,
            "profile_pic_url": user.profile_pic_url,
            "github_username": user.github_username,
        },
    }


@router.get("/google/login")
async def google_login():
    """Step 1: Send user to Google OAuth consent screen."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )

    params = urlencode(
        {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
    )
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Step 2: Exchange Google code, create/login user, then redirect to frontend."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

        if not token_res.is_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange Google authorization code",
            )

        token_data = token_res.json()
        provider_access_token = token_data.get("access_token")
        if not provider_access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Google access token",
            )

        profile_res = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {provider_access_token}"},
        )

        if not profile_res.is_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch Google profile",
            )

        profile = profile_res.json()
        email = profile.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account has no email",
            )

        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name=profile.get("name"),
                profile_pic_url=profile.get("picture"),
                is_active=True,
            )
            db.add(user)
        else:
            if not user.full_name:
                user.full_name = profile.get("name")
            if not user.profile_pic_url:
                user.profile_pic_url = profile.get("picture")

        db.commit()
        db.refresh(user)
        try:
            seed_initial_user_data(db, user.id)
        except Exception as seed_err:
            print(f"[OAuth Seed Error] {seed_err}")
        return _oauth_success_redirect(user)


@router.get("/user/{user_id}")
async def get_user_details(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    return {
        "username": user.username,
        "resume_text": user.resume_text,
    }


@router.post("/user/{user_id}/resume")
async def upload_resume(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # 1. Check file size (e.g., max 5MB)
    if hasattr(file, "size") and file.size is not None and file.size > 5 * 1024 * 1024:
        return {"error": "File too large. Maximum size is 5MB."}

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    file_content = await file.read()
    await file.close()
    filename = file.filename.lower()
    extracted_text = ""

    try:
        # 3. Parse based on file type
        if filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                extracted_text = "\n".join(
                    page.extract_text() for page in pdf.pages if page.extract_text()
                )

        elif filename.endswith(".docx"):
            doc = Document(io.BytesIO(file_content))
            extracted_text = "\n".join([para.text for para in doc.paragraphs])

        elif filename.endswith(".txt"):
            extracted_text = file_content.decode("utf-8")

        else:
            return {"error": "Unsupported file format. Please use PDF, DOCX, or TXT."}

        if not extracted_text.strip():
            return {"error": "Could not extract text from the document."}

        # 4. Save extracted text to the database profile
        user.resume_text = extracted_text
        db.commit()

        print(
            f"SUCCESS: Processed {filename} for {user.username}. Length: {len(extracted_text)}"
        )
        return {
            "message": "Resume processed and uploaded successfully!",
            "username": user.username,
        }

    except Exception as e:  # pragma: no cover - defensive logging
        print(f"ERROR processing file: {str(e)}")
        return {"error": f"Failed to process document: {str(e)}"}