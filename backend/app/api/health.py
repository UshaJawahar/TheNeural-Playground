from fastapi import APIRouter
from datetime import datetime
import logging

router = APIRouter(tags=["health"])
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    try:
        # Check spaCy model availability
        import spacy
        nlp = spacy.load("en_core_web_sm")
        spacy_status = "available"
        spacy_test = "working"
    except Exception as e:
        logger.error(f"spaCy model check failed: {e}")
        spacy_status = "unavailable"
        spacy_test = "failed"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "TheNeural Backend API",
        "version": "1.0.0",
        "components": {
            "api": "healthy",
            "spacy_model": spacy_status,
            "spacy_test": spacy_test
        }
    }


@router.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "TheNeural Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
