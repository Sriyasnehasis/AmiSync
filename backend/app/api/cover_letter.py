from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services import ai_service

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter"])


class CoverLetterRequest(BaseModel):
    full_name: str
    profession: str
    skills: List[str] = []
    company_name: str
    job_title: str
    job_description: Optional[str] = ""
    tone: Optional[str] = "professional"


@router.post("/generate")
async def generate_cover_letter(request: CoverLetterRequest):
    """Generate a personalized cover letter using Gemini AI."""
    result = await ai_service.generate_cover_letter(
        full_name=request.full_name,
        profession=request.profession,
        skills=request.skills,
        company_name=request.company_name,
        job_title=request.job_title,
        job_description=request.job_description,
        tone=request.tone,
    )
    return {"cover_letter": result, "status": "success"}


class DownloadRequest(BaseModel):
    full_name: str
    cover_letter: str

@router.post("/download")
async def download_cover_letter(request: DownloadRequest):
    """Download generated cover letter as a beautifully styled PDF file."""
    from app.utils.pdf_gen import generate_pdf_cover_letter
    from fastapi import Response
    
    pdf_bytes = generate_pdf_cover_letter(request.full_name, request.cover_letter)
    
    filename = f"{request.full_name.replace(' ', '_')}_Cover_Letter.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
