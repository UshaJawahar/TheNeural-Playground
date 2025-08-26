from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import logging
import asyncio
import threading

from .config import settings
from .api import projects, health, teachers, students, classrooms, demo_projects, scratch_services
from .api.guests import router as guests_router
from .training_worker import training_worker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TheNeural Backend API",
    description="Backend service for ML project management with GCP integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Define allowed origins for CORS
origins = [
    "https://the-neural-playground.vercel.app",   # Vercel Frontend
    "https://playground-neural-107731139870.us-central1.run.app",   # Frontend
    "https://scratch-editor-107731139870.us-central1.run.app",     # Scratch Editor
    "http://localhost:3000",   # Next.js dev server
    "http://localhost:8601",   # Another frontend port if used
]

# Add CORS middleware - UPDATED CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Allow listed origins
    allow_credentials=True,
    allow_methods=["*"],          # Allow all HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],          # Allow all headers
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # In production, restrict this
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "details": [str(exc)] if settings.node_env == "development" else []
        }
    )

# Include routers
app.include_router(health.router)
app.include_router(projects.router)
app.include_router(teachers.router)
app.include_router(students.router)
app.include_router(classrooms.router)
app.include_router(demo_projects.router)
app.include_router(guests_router)
app.include_router(scratch_services.router)

def start_training_worker():
    """Start training worker in background thread"""
    try:
        logger.info("Starting training worker in background...")
        training_worker.start_worker()
    except Exception as e:
        logger.error(f"Failed to start training worker: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting TheNeural Backend API...")
    logger.info(f"Environment: {settings.node_env}")
    logger.info(f"GCP Project: {settings.google_cloud_project}")
    logger.info(f"CORS Origin: {settings.cors_origin}")
    
    # Check spaCy model availability (non-blocking, optional)
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        logger.info("✅ spaCy English model loaded successfully")
    except ImportError:
        logger.info("📝 spaCy not installed yet - will install when needed")
    except OSError:
        logger.info("📥 spaCy model not downloaded yet - will download when needed")
    except Exception as e:
        logger.warning(f"⚠️ spaCy model check failed: {e}")
        logger.info("📝 Model will be downloaded when first training request is made")
    
    # Start training worker in background thread
    try:
        worker_thread = threading.Thread(target=start_training_worker, daemon=True)
        worker_thread.start()
        logger.info("Training worker started in background")
    except Exception as e:
        logger.error(f"Failed to start training worker: {e}")
    
    logger.info("✅ TheNeural Backend API startup complete")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down TheNeural Backend API...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.node_env == "development"
    )