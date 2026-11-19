import httpx
import logging
import json
import os
import datetime
from app.services.adzuna import fetch_india_jobs

logger = logging.getLogger(__name__)

async def fetch_remoteok_jobs(keyword: str = "Developer") -> list:
    """Fetch live remote jobs from RemoteOK (no API key required)."""
    url = "https://remoteok.com/api"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                jobs = []
                for item in data:
                    if not item or "position" not in item:
                        continue
                    
                    position = item.get("position", "")
                    tags = item.get("tags", [])
                    
                    kw = keyword.lower().strip()
                    has_kw = (
                        kw in position.lower() or 
                        any(kw in str(t).lower() for t in tags) or
                        kw in item.get("company", "").lower()
                    )
                    if keyword and not has_kw:
                        continue
                        
                    jobs.append({
                        "title": position,
                        "company": item.get("company", "Unknown"),
                        "location": item.get("location") or "Remote",
                        "description": item.get("description", ""),
                        "redirect_url": item.get("url"),
                        "source": "RemoteOK"
                    })
                return jobs
    except Exception as e:
        logger.error(f"Error fetching from RemoteOK: {e}")
    return []

async def fetch_arbeitnow_jobs(keyword: str = "Developer") -> list:
    """Fetch live jobs from Arbeitnow (no API key required)."""
    url = "https://www.arbeitnow.com/api/job-board-api"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                jobs = []
                results = data.get("data", [])
                for item in results:
                    title = item.get("title", "")
                    tags = item.get("tags", [])
                    
                    kw = keyword.lower().strip()
                    has_kw = (
                        kw in title.lower() or 
                        any(kw in str(t).lower() for t in tags) or
                        kw in item.get("company_name", "").lower()
                    )
                    if keyword and not has_kw:
                        continue
                        
                    jobs.append({
                        "title": title,
                        "company": item.get("company_name", "Unknown"),
                        "location": item.get("location") or "Remote",
                        "description": item.get("description", ""),
                        "redirect_url": item.get("url"),
                        "source": "Arbeitnow"
                    })
                return jobs
    except Exception as e:
        logger.error(f"Error fetching from Arbeitnow: {e}")
    return []

async def fetch_remotive_jobs(keyword: str = "Developer") -> list:
    """Fetch live remote jobs from Remotive (no API key required)."""
    url = f"https://remotive.com/api/remote-jobs"
    params = {"search": keyword}
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                jobs = []
                results = data.get("jobs", [])
                for item in results:
                    jobs.append({
                        "title": item.get("title", ""),
                        "company": item.get("company_name", "Unknown"),
                        "location": item.get("candidate_required_location") or "Remote",
                        "description": item.get("description", ""),
                        "redirect_url": item.get("url"),
                        "source": "Remotive"
                    })
                return jobs
    except Exception as e:
        logger.error(f"Error fetching from Remotive: {e}")
    return []

async def fetch_themuse_jobs(keyword: str = "Developer") -> list:
    """Fetch live jobs from The Muse (no API key required)."""
    url = "https://www.themuse.com/api/public/jobs"
    # Use keyword in desc field to query jobs
    params = {"page": 1, "desc": keyword}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                jobs = []
                results = data.get("results", [])
                for item in results:
                    locations = item.get("locations", [])
                    loc_str = locations[0].get("name") if locations else "Remote"
                    jobs.append({
                        "title": item.get("name", ""),
                        "company": (item.get("company") or {}).get("name") or "Unknown",
                        "location": loc_str,
                        "description": item.get("contents", ""),
                        "redirect_url": (item.get("refs") or {}).get("landing_page"),
                        "source": "TheMuse"
                    })
                return jobs
    except Exception as e:
        logger.error(f"Error fetching from The Muse: {e}")
    return []

async def fetch_reed_jobs(keyword: str = "Developer") -> list:
    """Fetch live jobs from Reed (requires REED_API_KEY in .env)."""
    api_key = os.getenv("REED_API_KEY")
    if not api_key:
        return []
        
    url = "https://www.reed.co.uk/api/1.0/search"
    params = {"keywords": keyword}
    try:
        # Reed API uses HTTP Basic Auth: key as username, empty password
        async with httpx.AsyncClient(timeout=10.0, auth=(api_key, "")) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                jobs = []
                results = data.get("results", [])
                for item in results:
                    jobs.append({
                        "title": item.get("jobTitle", ""),
                        "company": item.get("employerName", "Unknown"),
                        "location": item.get("locationName") or "United Kingdom",
                        "description": item.get("jobDescription", ""),
                        "redirect_url": item.get("jobUrl"),
                        "source": "Reed"
                    })
                return jobs
    except Exception as e:
        logger.error(f"Error fetching from Reed: {e}")
    return []

async def fetch_jsearch_jobs(keyword: str = "Developer", location: str = "India") -> list:
    """Fetch live jobs from JSearch (RapidAPI) (requires RAPIDAPI_KEY in .env)."""
    api_key = os.getenv("RAPIDAPI_KEY") or os.getenv("JSEARCH_API_KEY")
    if not api_key:
        return []
        
    url = "https://jsearch.p.rapidapi.com/search"
    query = f"{keyword} in {location}"
    params = {"query": query, "num_pages": 1}
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }
    try:
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                jobs = []
                results = data.get("data", [])
                for item in results:
                    city = item.get("job_city")
                    country = item.get("job_country")
                    loc = f"{city}, {country}" if city and country else (city or country or "Remote")
                    jobs.append({
                        "title": item.get("job_title", ""),
                        "company": item.get("employer_name", "Unknown"),
                        "location": loc,
                        "description": item.get("job_description", ""),
                        "redirect_url": item.get("job_apply_link") or item.get("job_google_link"),
                        "source": "JSearch"
                    })
                return jobs
    except Exception as e:
        logger.error(f"Error fetching from JSearch: {e}")
    return []

async def fetch_aggregated_jobs(keyword: str = "Developer", location: str = "India") -> list:
    """Combines Adzuna, RemoteOK, Arbeitnow, Remotive, The Muse, Reed, and JSearch."""
    # 1. Fetch from Adzuna
    adzuna_jobs = []
    try:
        adzuna_data = await fetch_india_jobs(keyword=keyword, location=location)
        results = adzuna_data.get("results", [])
        
        is_mock = len(results) == 1 and results[0].get("company", {}).get("display_name") == "Tech Corp"
        if not is_mock:
            for item in results:
                company = item.get("company")
                company_name = company.get("display_name") if isinstance(company, dict) else company
                loc = item.get("location")
                loc_name = loc.get("display_name") if isinstance(loc, dict) else loc
                
                adzuna_jobs.append({
                    "title": item.get("title"),
                    "company": company_name or "Unknown Company",
                    "location": loc_name or "India",
                    "description": item.get("description") or "",
                    "redirect_url": item.get("redirect_url") or item.get("url"),
                    "source": "Adzuna"
                })
    except Exception as e:
        logger.error(f"Adzuna search error in aggregator: {e}")

    # 2. Fetch from free no-key sources (RemoteOK, Arbeitnow, Remotive, The Muse)
    remoteok_jobs = await fetch_remoteok_jobs(keyword=keyword)
    arbeitnow_jobs = await fetch_arbeitnow_jobs(keyword=keyword)
    remotive_jobs = await fetch_remotive_jobs(keyword=keyword)
    themuse_jobs = await fetch_themuse_jobs(keyword=keyword)
    
    # 3. Fetch from key-based sources (Reed, JSearch)
    reed_jobs = await fetch_reed_jobs(keyword=keyword)
    jsearch_jobs = await fetch_jsearch_jobs(keyword=keyword, location=location)
    
    # Merge and deduplicate based on (title + company)
    all_jobs = adzuna_jobs + remoteok_jobs + arbeitnow_jobs + remotive_jobs + themuse_jobs + reed_jobs + jsearch_jobs
    
    seen = set()
    deduped = []
    for job in all_jobs:
        if not job.get("title") or not job.get("company"):
            continue
        key = (job["title"].lower().strip(), job["company"].lower().strip())
        if key not in seen:
            seen.add(key)
            deduped.append(job)
            
    return deduped
