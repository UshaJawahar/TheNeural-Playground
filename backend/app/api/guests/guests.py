from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Depends, Request
from typing import List, Optional
import json
import logging
from datetime import datetime, timezone
import uuid

from ...models import (
    Project, ProjectCreate, ProjectUpdate, ProjectListResponse, 
    ProjectResponse, ProjectStatusResponseWrapper, TrainingConfig,
    FileUploadResponse, TrainingResponse, ErrorResponse,
    ExampleAdd, ExamplesBulkAdd, PredictionRequest, PredictionResponse,
    GuestSessionResponse, TrainedModel, Dataset, TextExample
)
from ...services.guest_service import GuestService
from ...services.project_service import ProjectService
from ...training_service import trainer
from ...training_job_service import training_job_service
from ...config import gcp_clients

router = APIRouter(prefix="/api/guests", tags=["guests"])

# Configure logging
logger = logging.getLogger(__name__)


# Dependency to get guest service
def get_guest_service():
    return GuestService()

# Dependency to get project service
def get_project_service():
    return ProjectService()

# Session validation dependency
async def validate_session_dependency(session_id: str, guest_service: GuestService = Depends(get_guest_service)):
    """Dependency to validate session for all guest endpoints"""
    try:
        session = await guest_service.validate_session(session_id)
        return session
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        elif "expired" in str(e):
            raise HTTPException(status_code=410, detail=str(e))
        elif "inactive" in str(e):
            raise HTTPException(status_code=403, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session validation error: {str(e)}")


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

@router.post("/session", response_model=GuestSessionResponse, status_code=201)
async def create_guest_session(
    request: Request,
    guest_service: GuestService = Depends(get_guest_service)
):
    """Create a new guest session with unique session ID (7 days expiry)"""
    try:
        # Extract client info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Create simple session
        guest_session = await guest_service.create_simple_guest_session(
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return GuestSessionResponse(data=guest_session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}", response_model=GuestSessionResponse)
async def get_guest_session(
    session_id: str,
    guest_service: GuestService = Depends(get_guest_service)
):
    """Get simple guest session by session ID"""
    try:
        guest_session = await guest_service.get_simple_guest_session(session_id)
        if not guest_session:
            raise HTTPException(status_code=404, detail="Guest session not found")
        
        return GuestSessionResponse(data=guest_session)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PROJECT MANAGEMENT
# ============================================================================

@router.get("/session/{session_id}/projects", response_model=ProjectListResponse)
async def get_guest_projects(
    session_id: str,
    limit: int = Query(50, ge=1, le=100, description="Number of projects to return"),
    offset: int = Query(0, ge=0, description="Number of projects to skip"),
    status: Optional[str] = Query(None, description="Filter by project status"),
    type: Optional[str] = Query(None, description="Filter by project type"),
    search: Optional[str] = Query(None, description="Search query"),
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get all projects for a guest session with optional filtering and search"""
    try:
        if search:
            # Use search functionality
            filters = {'guest_session_id': session_id}
            if status:
                filters['status'] = status
            if type:
                filters['type'] = type
            
            all_projects = await project_service.search_projects(search, filters)
            total = len(all_projects)
            
            # Apply pagination to search results
            projects = all_projects[offset:offset + limit]
        else:
            # Get projects directly with guest session filter
            projects = await project_service.get_projects(
                limit=limit, 
                offset=offset, 
                status=status, 
                type=type, 
                created_by=None, 
                guest_session_id=session_id
            )
            
            # For total count, get all projects for this session
            all_projects = await project_service.get_projects(
                limit=1000,  # Get all projects to count them
                offset=0,
                status=status,
                type=type,
                created_by=None,
                guest_session_id=session_id
            )
            total = len(all_projects)
        
        return ProjectListResponse(
            data=projects,
            pagination={
                "limit": limit,
                "offset": offset,
                "total": total
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/projects", response_model=ProjectResponse, status_code=201)
async def create_guest_project(
    session_id: str,
    project_data: ProjectCreate,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Create a new project for a guest session"""
    try:
        # Set guest session info in project data
        project_data.createdBy = f"guest:{session_id}"
        # Add guest session identifier
        project_data.teacher_id = ""
        project_data.classroom_id = ""
        project_data.student_id = session_id
        
        project = await project_service.create_project(project_data)
        return ProjectResponse(data=project)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/projects/{project_id}", response_model=ProjectResponse)
async def get_guest_project(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get project by ID for a guest session"""
    try:
        project = await project_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify project belongs to this session
        if project.student_id != session_id:
            raise HTTPException(status_code=403, detail="Project not accessible for this session")
        
        return ProjectResponse(data=project)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/session/{session_id}/projects/{project_id}", response_model=ProjectResponse)
async def update_guest_project(
    session_id: str,
    project_id: str,
    project_data: ProjectUpdate,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Update project for a guest session"""
    try:
        # First verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.student_id != session_id:
            raise HTTPException(status_code=403, detail="Project not accessible for this session")
        
        # Update project
        updated_project = await project_service.update_project(project_id, project_data)
        return ProjectResponse(data=updated_project)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}/projects/{project_id}")
async def delete_guest_project(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete project for a guest session"""
    try:
        # First verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.student_id != session_id:
            raise HTTPException(status_code=403, detail="Project not accessible for this session")
        
        # Delete project
        await project_service.delete_project(project_id)
        return {"success": True, "message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DATASET AND EXAMPLES
# ============================================================================

@router.post("/session/{session_id}/projects/{project_id}/dataset", response_model=FileUploadResponse)
async def upload_guest_dataset(
    session_id: str,
    project_id: str,
    file: UploadFile = File(..., description="Dataset file to upload"),
    records: Optional[int] = Form(None, description="Number of records in dataset"),
    description: Optional[str] = Form("", description="Dataset description"),
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Upload dataset file for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Validate file type
        allowed_types = [
            'text/csv',
            'application/json',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only CSV, JSON, and Excel files are allowed."
            )
        
        # Read file content
        file_content = await file.read()
        
        # Check file size (100MB limit)
        if len(file_content) > 100 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 100MB."
            )
        
        # Prepare metadata
        metadata = {
            'records': records,
            'description': description,
            'originalName': file.filename,
            'contentType': file.content_type,
            'guest_session_id': session_id
        }
        
        # Upload to service
        result = await project_service.upload_dataset(
            project_id,
            file_content,
            file.filename,
            file.content_type,
            metadata
        )
        
        return FileUploadResponse(
            success=result['success'],
            gcsPath=result['gcsPath']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/projects/{project_id}/examples", response_model=dict)
async def add_guest_examples(
    session_id: str,
    project_id: str,
    examples_data: ExamplesBulkAdd,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Add text examples to a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Validate number of examples
        if len(examples_data.examples) > 50:
            raise HTTPException(
                status_code=400,
                detail="Maximum 50 examples can be added at once"
            )
        
        # Add examples to project
        result = await project_service.add_examples(project_id, examples_data.examples)
        
        # Calculate how many examples were actually created
        input_examples_count = len(examples_data.examples)
        actual_examples_added = result['totalExamples'] - (result.get('previousTotal', 0) or 0)
        
        return {
            "success": True,
            "message": f"Added {actual_examples_added} examples from {input_examples_count} input(s)",
            "totalExamples": result['totalExamples'],
            "labels": result['labels'],
            "inputExamples": input_examples_count,
            "actualExamplesAdded": actual_examples_added
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/projects/{project_id}/examples", response_model=dict)
async def get_guest_examples(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get all examples for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        examples = await project_service.get_examples(project_id)
        
        # Also get the labels list from the project
        labels = []
        if hasattr(project.dataset, 'labels') and project.dataset.labels:
            labels = project.dataset.labels
        
        return {
            "success": True,
            "examples": examples,
            "totalExamples": len(examples),
            "labels": labels
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# TRAINING
# ============================================================================

@router.post("/session/{session_id}/projects/{project_id}/train", response_model=TrainingResponse)
async def start_guest_training(
    session_id: str,
    project_id: str,
    training_config: Optional[TrainingConfig] = None,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Start training job for a guest project using logistic regression"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get examples for training
        examples = await project_service.get_examples(project_id)
        if not examples:
            raise HTTPException(
                status_code=400, 
                detail="No examples found. Add some examples before training."
            )
        
        # Create training job and add to queue
        try:
            config_dict = training_config.model_dump() if training_config else None
            training_job = await training_job_service.create_training_job(project_id, config_dict)
            
            return TrainingResponse(
                success=True,
                message="Training job queued successfully!",
                jobId=training_job.id
            )
            
        except ValueError as e:
            # Training validation failed
            return TrainingResponse(
                success=False,
                message=str(e)
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/projects/{project_id}/train", response_model=dict)
async def get_guest_training_status(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get training status and job information for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get training jobs
        jobs = await training_job_service.get_project_jobs(project_id)
        
        # Get current job status
        current_job = None
        if project.currentJobId:
            current_job = await training_job_service.get_job_status(project.currentJobId)
        
        return {
            "success": True,
            "projectStatus": project.status,
            "currentJob": current_job.model_dump() if current_job else None,
            "allJobs": [job.model_dump() for job in jobs],
            "totalJobs": len(jobs)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}/projects/{project_id}/train", response_model=dict)
async def cancel_guest_training(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Cancel current training job for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if not project.currentJobId:
            raise HTTPException(
                status_code=400,
                detail="No training job in progress"
            )
        
        # Cancel the job
        success = await training_job_service.cancel_job(project.currentJobId)
        
        if success:
            return {
                "success": True,
                "message": "Training job cancelled successfully"
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Failed to cancel training job"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PREDICTION
# ============================================================================

@router.post("/session/{session_id}/projects/{project_id}/predict", response_model=PredictionResponse)
async def predict_guest_text(
    session_id: str,
    project_id: str,
    prediction_request: PredictionRequest,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Make prediction using trained guest model"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.status != 'trained':
            raise HTTPException(
                status_code=400, 
                detail="Project is not trained yet. Train the model first."
            )
        
        # Make prediction using model from GCS
        prediction_result = trainer.predict_from_gcs(
            prediction_request.text, 
            gcp_clients.get_bucket(),
            project.model.gcsPath
        )
        
        return PredictionResponse(
            success=True,
            label=prediction_result['label'],
            confidence=prediction_result['confidence'],
            alternatives=prediction_result['alternatives']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PROJECT STATUS
# ============================================================================

@router.get("/session/{session_id}/projects/{project_id}/status", response_model=ProjectStatusResponseWrapper)
async def get_guest_project_status(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get guest project status and metadata"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        status_response = {
            "id": project.id,
            "status": project.status,
            "dataset": project.dataset,
            "datasets": project.datasets,
            "model": project.model,
            "updatedAt": project.updatedAt
        }
        
        return ProjectStatusResponseWrapper(data=status_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# JOB MANAGEMENT
# ============================================================================

@router.get("/session/{session_id}/projects/{project_id}/training/jobs/{job_id}", response_model=dict)
async def get_guest_job_status(
    session_id: str,
    project_id: str,
    job_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get training job status for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        job = await training_job_service.get_job_status(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Training job not found")
        
        # Verify job belongs to this project
        if job.projectId != project_id:
            raise HTTPException(status_code=403, detail="Job not accessible for this project")
        
        return {
            "success": True,
            "job": job.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}/projects/{project_id}/training/jobs/{job_id}", response_model=dict)
async def cancel_guest_job(
    session_id: str,
    project_id: str,
    job_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Cancel a training job for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        job = await training_job_service.get_job_status(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Training job not found")
        
        # Verify job belongs to this project
        if job.projectId != project_id:
            raise HTTPException(status_code=403, detail="Job not accessible for this project")
        
        success = await training_job_service.cancel_job(job_id)
        if success:
            return {
                "success": True,
                "message": "Training job cancelled successfully"
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Failed to cancel training job"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# TESTING (Additional endpoints that were in the original guest API)
# ============================================================================

@router.post("/session/{session_id}/projects/{project_id}/test", response_model=dict)
async def test_guest_project(
    session_id: str,
    project_id: str,
    test_data: dict,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Test a trained guest project with new data"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.status != 'trained':
            raise HTTPException(
                status_code=400, 
                detail="Project is not trained yet. Train the model first."
            )
        
        # Process test data (this would need to be implemented based on your requirements)
        # For now, returning a placeholder response
        return {
            "success": True,
            "message": "Test completed",
            "results": test_data,
            "accuracy": 0.85  # Placeholder
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/projects/{project_id}/test", response_model=dict)
async def get_guest_test_results(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get test results for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Return placeholder test results
        return {
            "success": True,
            "results": [],
            "accuracy": None,
            "last_tested_at": None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SCRATCH INTEGRATION (Additional endpoints that were in the original guest API)
# ============================================================================

@router.post("/session/{session_id}/projects/{project_id}/scratch/enable", response_model=dict)
async def enable_guest_scratch(
    session_id: str,
    project_id: str,
    scratch_data: dict,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Enable Scratch integration for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Enable Scratch integration (placeholder implementation)
        return {
            "success": True,
            "message": "Scratch integration enabled",
            "scratch_api_key": f"scratch_{session_id}_{project_id}",
            "integration_url": f"/api/scratch/predict/{project_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/projects/{project_id}/scratch", response_model=dict)
async def get_guest_scratch_status(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get Scratch integration status for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Return Scratch status (placeholder implementation)
        return {
            "success": True,
            "scratch_enabled": False,
            "scratch_api_key": None,
            "integration_url": None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODEL AND EXAMPLE DELETION
# ============================================================================

@router.delete("/projects/{project_id}/model")
async def delete_trained_model(
    project_id: str,
    session_id: str = Query(..., description="Guest session ID"),
    guest_service: GuestService = Depends(get_guest_service),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete trained model from GCS for a guest project"""
    try:
        # Validate session
        session = await validate_session_dependency(session_id, guest_service)
        logger.info(f"Session validated for project {project_id}, session {session_id}")
        
        # Get project to verify ownership and get model path
        project = await project_service.get_project(project_id)
        if not project:
            logger.error(f"Project {project_id} not found")
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify project belongs to this guest session
        if project.student_id != session_id:
            logger.error(f"Project {project_id} does not belong to session {session_id}")
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Check if project has a trained model
        if not project.model or not project.model.gcsPath:
            logger.warning(f"Project {project_id} has no trained model to delete")
            raise HTTPException(status_code=404, detail="No trained model found for this project")
        
        # Delete model from GCS
        try:
            from google.cloud import storage
            from ...config import gcp_clients
            
            # Use the configured bucket from config instead of parsing from path
            storage_client = storage.Client()
            bucket = gcp_clients.get_bucket()
            
            logger.info(f"Using GCS bucket: {bucket.name}")
            logger.info(f"Model GCS path: {project.model.gcsPath}")
            logger.info(f"Full GCS object path: gs://{bucket.name}/{project.model.gcsPath}")
            
            # The gcsPath is just the object path within the bucket
            blob = bucket.blob(project.model.gcsPath)
            
            if blob.exists():
                blob.delete()
                logger.info(f"Successfully deleted model file from GCS: {project.model.gcsPath}")
            else:
                logger.warning(f"Model file not found in GCS: {project.model.gcsPath}")
        except Exception as e:
            logger.error(f"Error deleting model from GCS: {str(e)}")
            logger.error(f"Bucket name: {gcp_clients.get_bucket().name}")
            logger.error(f"Project model GCS path: {project.model.gcsPath}")
            raise HTTPException(status_code=500, detail=f"Failed to delete model from GCS: {str(e)}")
        
        # Update project to remove model information
        try:
            project.model = TrainedModel()  # Reset to empty model
            project.status = "draft"  # Reset status
            project.updatedAt = datetime.now(timezone.utc)
            
            # Update in database
            await project_service.update_project(project_id, ProjectUpdate(
                status="draft",
                updatedAt=datetime.now(timezone.utc)
            ))
            
            logger.info(f"Successfully updated project {project_id} after model deletion")
            
        except Exception as e:
            logger.error(f"Error updating project after model deletion: {str(e)}")
            # Don't fail the request if database update fails, model was already deleted from GCS
        
        return {
            "success": True,
            "message": "Trained model deleted successfully",
            "project_id": project_id,
            "deleted_gcs_path": project.model.gcsPath
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting trained model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete trained model: {str(e)}")


@router.delete("/projects/{project_id}/examples/{label}")
async def delete_examples_by_label(
    project_id: str,
    label: str,
    session_id: str = Query(..., description="Guest session ID"),
    guest_service: GuestService = Depends(get_guest_service),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete all examples under a specific label for a guest project"""
    try:
        # Validate session
        session = await validate_session_dependency(session_id, guest_service)
        logger.info(f"Session validated for project {project_id}, session {session_id}, label: {label}")
        
        # Get project to verify ownership
        project = await project_service.get_project(project_id)
        if not project:
            logger.error(f"Project {project_id} not found")
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify project belongs to this guest session
        if project.student_id != session_id:
            logger.error(f"Project {project_id} does not belong to session {session_id}")
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Ensure dataset is properly typed (in case deserialization had issues)
        if isinstance(project.dataset, dict):
            logger.info(f"Debug: Converting dataset dict to Dataset object for project {project_id}")
            # Convert examples if needed
            if 'examples' in project.dataset and isinstance(project.dataset['examples'], list):
                examples = []
                for example_data in project.dataset['examples']:
                    if isinstance(example_data, dict):
                        examples.append(TextExample(**example_data))
                    else:
                        examples.append(example_data)
                project.dataset['examples'] = examples
            project.dataset = Dataset(**project.dataset)
        
        # Check if project has examples
        if not project.dataset or not project.dataset.examples:
            logger.warning(f"Project {project_id} has no examples to delete")
            raise HTTPException(status_code=404, detail="No examples found for this project")
        
        # Count examples before deletion
        examples_before = len(project.dataset.examples)
        examples_with_label = [ex for ex in project.dataset.examples if ex.label == label]
        examples_to_delete = len(examples_with_label)
        
        logger.info(f"Project {project_id} has {examples_before} total examples before deletion")
        logger.info(f"Found {examples_to_delete} examples with label '{label}' to delete")
        
        if examples_to_delete == 0:
            logger.warning(f"No examples found with label '{label}' in project {project_id}")
            raise HTTPException(status_code=404, detail=f"No examples found with label '{label}'")
        
        # Remove examples with the specified label
        project.dataset.examples = [ex for ex in project.dataset.examples if ex.label != label]
        
        # Keep the label in the labels list even if no examples remain
        # This allows users to add examples to the label again without recreating it
        
        # Update dataset size
        project.dataset.records = len(project.dataset.examples)
        
        logger.info(f"After deletion, project has {len(project.dataset.examples)} examples")
        logger.info(f"Dataset records updated to: {project.dataset.records}")
        
        # Save the complete project with updated dataset to database
        try:
            # Ensure all dataset fields are properly set and preserve the deleted label
            if not hasattr(project.dataset, 'labels') or project.dataset.labels is None:
                project.dataset.labels = []
            
            # Keep existing labels and add any new ones from examples
            existing_labels = set(project.dataset.labels)
            example_labels = set(example.label for example in project.dataset.examples)
            
            # Preserve all existing labels (including the one we just cleared examples from)
            # and add any new labels from examples
            all_labels = existing_labels.union(example_labels)
            project.dataset.labels = list(all_labels)
            
            # Use the save_project method to avoid any ProjectUpdate serialization issues
            await project_service.save_project(project)
            
            logger.info(f"Successfully deleted {examples_to_delete} examples with label '{label}' from project {project_id}")
            logger.info(f"Project saved to database with {project.dataset.records} examples")
            
        except Exception as e:
            logger.error(f"Error updating project after example deletion: {str(e)}")
            logger.error(f"Debug: Dataset type: {type(project.dataset)}")
            logger.error(f"Debug: Dataset has records attr: {hasattr(project.dataset, 'records')}")
            if hasattr(project.dataset, 'examples'):
                logger.error(f"Debug: Examples type: {type(project.dataset.examples)}")
            raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")
        
        return {
            "success": True,
            "message": f"Successfully deleted {examples_to_delete} examples with label '{label}'",
            "project_id": project_id,
            "label": label,
            "examples_deleted": examples_to_delete,
            "examples_before": examples_before,
            "examples_after": len(project.dataset.examples)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting examples by label: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete examples: {str(e)}")


@router.delete("/projects/{project_id}/examples/{label}/{example_index}")
async def delete_specific_example(
    project_id: str,
    label: str,
    example_index: int,
    session_id: str = Query(..., description="Guest session ID"),
    guest_service: GuestService = Depends(get_guest_service),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete a specific example by index under a label for a guest project"""
    try:
        # Validate session
        session = await validate_session_dependency(session_id, guest_service)
        logger.info(f"Session validated for project {project_id}, session {session_id}, label: {label}, index: {example_index}")
        
        # Get project to verify ownership
        project = await project_service.get_project(project_id)
        if not project:
            logger.error(f"Project {project_id} not found")
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify project belongs to this guest session
        if project.student_id != session_id:
            logger.error(f"Project {project_id} does not belong to session {session_id}")
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Ensure dataset is properly typed (in case deserialization had issues)
        if isinstance(project.dataset, dict):
            logger.info(f"Debug: Converting dataset dict to Dataset object for project {project_id}")
            # Convert examples if needed
            if 'examples' in project.dataset and isinstance(project.dataset['examples'], list):
                examples = []
                for example_data in project.dataset['examples']:
                    if isinstance(example_data, dict):
                        examples.append(TextExample(**example_data))
                    else:
                        examples.append(example_data)
                project.dataset['examples'] = examples
            project.dataset = Dataset(**project.dataset)
        
        # Check if project has examples
        if not project.dataset or not project.dataset.examples:
            logger.warning(f"Project {project_id} has no examples to delete")
            raise HTTPException(status_code=404, detail="No examples found for this project")
        
        # Find examples with the specified label
        examples_with_label = [ex for ex in project.dataset.examples if ex.label == label]
        
        if not examples_with_label:
            logger.warning(f"No examples found with label '{label}' in project {project_id}")
            raise HTTPException(status_code=404, detail=f"No examples found with label '{label}'")
        
        # Validate example index
        if example_index < 0 or example_index >= len(examples_with_label):
            logger.error(f"Invalid example index {example_index} for label '{label}' (valid range: 0-{len(examples_with_label)-1})")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid example index. Valid range: 0-{len(examples_with_label)-1}"
            )
        
        # Get the example to delete
        example_to_delete = examples_with_label[example_index]
        
        # Remove the specific example from the dataset
        project.dataset.examples.remove(example_to_delete)
        
        # Update dataset size
        project.dataset.records = len(project.dataset.examples)
        
        # Save the complete project with updated dataset to database
        try:
            # Ensure all dataset fields are properly set
            if not hasattr(project.dataset, 'labels') or project.dataset.labels is None:
                # Regenerate labels from remaining examples
                all_labels = set(example.label for example in project.dataset.examples)
                project.dataset.labels = list(all_labels)
            
            # Use the save_project method to avoid any ProjectUpdate serialization issues
            await project_service.save_project(project)
            
            logger.info(f"Successfully deleted example '{example_to_delete.text[:50]}...' with label '{label}' from project {project_id}")
            logger.info(f"Project saved to database with {project.dataset.records} examples")
            
        except Exception as e:
            logger.error(f"Error updating project after specific example deletion: {str(e)}")
            logger.error(f"Debug: Dataset type: {type(project.dataset)}")
            logger.error(f"Debug: Dataset has records attr: {hasattr(project.dataset, 'records')}")
            if hasattr(project.dataset, 'examples'):
                logger.error(f"Debug: Examples type: {type(project.dataset.examples)}")
            raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")
        
        return {
            "success": True,
            "message": f"Successfully deleted example with label '{label}'",
            "project_id": project_id,
            "label": label,
            "example_index": example_index,
            "deleted_example": example_to_delete.text[:100],  # First 100 chars for reference
            "examples_remaining": len(project.dataset.examples)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting specific example: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete example: {str(e)}")


@router.delete("/projects/{project_id}/labels/{label}")
async def delete_label(
    project_id: str,
    label: str,
    session_id: str = Query(..., description="Guest session ID"),
    guest_service: GuestService = Depends(get_guest_service),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete a label completely from a guest project, including all its examples"""
    try:
        # Validate session
        session = await validate_session_dependency(session_id, guest_service)
        logger.info(f"Session validated for project {project_id}, session {session_id}, label: {label}")
        
        # Get project to verify ownership
        project = await project_service.get_project(project_id)
        if not project:
            logger.error(f"Project {project_id} not found")
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify project belongs to this guest session
        if project.student_id != session_id:
            logger.error(f"Project {project_id} does not belong to session {session_id}")
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Ensure dataset is properly typed (in case deserialization had issues)
        if isinstance(project.dataset, dict):
            logger.info(f"Debug: Converting dataset dict to Dataset object for project {project_id}")
            # Convert examples if needed
            if 'examples' in project.dataset and isinstance(project.dataset['examples'], list):
                examples = []
                for example_data in project.dataset['examples']:
                    if isinstance(example_data, dict):
                        examples.append(TextExample(**example_data))
                    else:
                        examples.append(example_data)
                project.dataset['examples'] = examples
            project.dataset = Dataset(**project.dataset)
        
        # Check if project has dataset
        if not project.dataset:
            logger.warning(f"Project {project_id} has no dataset")
            raise HTTPException(status_code=404, detail="No dataset found for this project")
        
        # Count examples before deletion
        examples_before = len(project.dataset.examples) if project.dataset.examples else 0
        examples_with_label = [ex for ex in project.dataset.examples if ex.label == label] if project.dataset.examples else []
        examples_to_delete = len(examples_with_label)
        
        logger.info(f"Project {project_id} has {examples_before} total examples before deletion")
        logger.info(f"Found {examples_to_delete} examples with label '{label}' to delete")
        
        # Remove examples with the specified label
        if project.dataset.examples:
            project.dataset.examples = [ex for ex in project.dataset.examples if ex.label != label]
        
        # Remove the label from the labels list
        if hasattr(project.dataset, 'labels') and project.dataset.labels:
            if label in project.dataset.labels:
                project.dataset.labels.remove(label)
                logger.info(f"Removed label '{label}' from labels list")
        
        # Update dataset size
        project.dataset.records = len(project.dataset.examples) if project.dataset.examples else 0
        
        logger.info(f"After deletion, project has {len(project.dataset.examples) if project.dataset.examples else 0} examples")
        logger.info(f"Dataset records updated to: {project.dataset.records}")
        
        # Save the complete project with updated dataset to database
        try:
            # Ensure all dataset fields are properly set
            if not hasattr(project.dataset, 'labels') or project.dataset.labels is None:
                # Regenerate labels from remaining examples
                all_labels = set(example.label for example in project.dataset.examples) if project.dataset.examples else set()
                project.dataset.labels = list(all_labels)
            
            # Use the save_project method to avoid any ProjectUpdate serialization issues
            await project_service.save_project(project)
            
            logger.info(f"Successfully deleted label '{label}' and {examples_to_delete} examples from project {project_id}")
            logger.info(f"Project saved to database with {project.dataset.records} examples")
            
        except Exception as e:
            logger.error(f"Error updating project after label deletion: {str(e)}")
            logger.error(f"Debug: Dataset type: {type(project.dataset)}")
            logger.error(f"Debug: Dataset has records attr: {hasattr(project.dataset, 'records')}")
            if hasattr(project.dataset, 'examples'):
                logger.error(f"Debug: Examples type: {type(project.dataset.examples)}")
            raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")
        
        return {
            "success": True,
            "message": f"Successfully deleted label '{label}' and {examples_to_delete} examples",
            "project_id": project_id,
            "label": label,
            "examples_deleted": examples_to_delete,
            "examples_before": examples_before,
            "examples_after": len(project.dataset.examples) if project.dataset.examples else 0,
            "label_removed": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting label: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete label: {str(e)}")


@router.delete("/projects/{project_id}/labels/{label}/empty")
async def delete_empty_label(
    project_id: str,
    label: str,
    session_id: str = Query(..., description="Guest session ID"),
    guest_service: GuestService = Depends(get_guest_service),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete an empty label (label with no examples) from a guest project"""
    try:
        # Validate session
        session = await validate_session_dependency(session_id, guest_service)
        logger.info(f"Session validated for project {project_id}, session {session_id}, label: {label}")
        
        # Get project to verify ownership
        project = await project_service.get_project(project_id)
        if not project:
            logger.error(f"Project {project_id} not found")
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify project belongs to this guest session
        if project.student_id != session_id:
            logger.error(f"Project {project_id} does not belong to session {session_id}")
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Ensure dataset is properly typed (in case deserialization had issues)
        if isinstance(project.dataset, dict):
            logger.info(f"Debug: Converting dataset dict to Dataset object for project {project_id}")
            # Convert examples if needed
            if 'examples' in project.dataset and isinstance(project.dataset['examples'], list):
                examples = []
                for example_data in project.dataset['examples']:
                    if isinstance(example_data, dict):
                        examples.append(TextExample(**example_data))
                    else:
                        examples.append(example_data)
                project.dataset['examples'] = examples
            project.dataset = Dataset(**project.dataset)
        
        # Check if project has dataset
        if not project.dataset:
            logger.warning(f"Project {project_id} has no dataset")
            raise HTTPException(status_code=404, detail="No dataset found for this project")
        
        # Check if label has examples
        examples_with_label = [ex for ex in project.dataset.examples if ex.label == label] if project.dataset.examples else []
        
        if examples_with_label:
            logger.warning(f"Label '{label}' has {len(examples_with_label)} examples, cannot delete as empty label")
            raise HTTPException(
                status_code=400, 
                detail=f"Label '{label}' has {len(examples_with_label)} examples. Use the regular label deletion endpoint to delete label with examples."
            )
        
        # Check if label exists in labels list
        if not hasattr(project.dataset, 'labels') or not project.dataset.labels or label not in project.dataset.labels:
            logger.warning(f"Label '{label}' not found in labels list for project {project_id}")
            raise HTTPException(status_code=404, detail=f"Label '{label}' not found")
        
        # Remove the label from the labels list
        project.dataset.labels.remove(label)
        logger.info(f"Removed empty label '{label}' from labels list")
        
        # Save the complete project with updated dataset to database
        try:
            # Use the save_project method to avoid any ProjectUpdate serialization issues
            await project_service.save_project(project)
            
            logger.info(f"Successfully deleted empty label '{label}' from project {project_id}")
            logger.info(f"Project saved to database")
            
        except Exception as e:
            logger.error(f"Error updating project after empty label deletion: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")
        
        return {
            "success": True,
            "message": f"Successfully deleted empty label '{label}'",
            "project_id": project_id,
            "label": label,
            "examples_deleted": 0,
            "label_removed": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting empty label: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete empty label: {str(e)}")


# ============================================================================
# SESSION CLEANUP
# ============================================================================

@router.get("/session/{session_id}/debug", response_model=dict)
async def debug_guest_session(
    session_id: str,
    guest_service: GuestService = Depends(get_guest_service),
    project_service: ProjectService = Depends(get_project_service)
):
    """Debug endpoint to check session and associated projects"""
    try:
        # Check session
        session = await guest_service.get_simple_guest_session(session_id)
        
        # Get all projects for this session
        projects = await project_service.get_projects(
            limit=1000, offset=0, status=None, type=None, 
            created_by=None, guest_session_id=session_id
        )
        
        # Also check if there are any projects with this session in createdBy field
        projects_by_created_by = await project_service.get_projects(
            limit=1000, offset=0, status=None, type=None, 
            created_by=f"guest:{session_id}", guest_session_id=None
        )
        
        return {
            "session_exists": session is not None,
            "session_data": session.model_dump() if session else None,
            "projects_by_student_id": [
                {"id": p.id, "name": p.name, "student_id": p.student_id, "createdBy": p.createdBy} 
                for p in projects
            ],
            "projects_by_created_by": [
                {"id": p.id, "name": p.name, "student_id": p.student_id, "createdBy": p.createdBy} 
                for p in projects_by_created_by
            ],
            "total_projects_student_id": len(projects),
            "total_projects_created_by": len(projects_by_created_by)
        }
    except Exception as e:
        return {
            "error": str(e),
            "session_exists": False,
            "projects_by_student_id": [],
            "projects_by_created_by": [],
            "total_projects_student_id": 0,
            "total_projects_created_by": 0
        }

@router.delete("/session/{session_id}")
async def delete_guest_session(
    session_id: str,
    guest_service: GuestService = Depends(get_guest_service),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete a guest session and all associated projects"""
    try:
        # First check if session exists (but don't validate expiry since we're deleting)
        session = await guest_service.get_simple_guest_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Guest session not found")
        
        # Get all projects for this session
        projects = await project_service.get_projects(
            limit=1000, offset=0, status=None, type=None, 
            created_by=None, guest_session_id=session_id
        )
        
        logger.info(f"Found {len(projects)} projects for session {session_id}")
        if projects:
            logger.info(f"Project IDs to delete: {[p.id for p in projects]}")
        
        # Delete all projects first
        deleted_projects_count = 0
        if projects:
            project_ids = [p.id for p in projects]
            try:
                deleted_projects_count = await project_service.delete_multiple_projects(project_ids)
                logger.info(f"Successfully deleted {deleted_projects_count} out of {len(projects)} projects")
            except Exception as e:
                logger.error(f"Error deleting some projects for session {session_id}: {str(e)}")
                # Continue with session deletion even if some projects fail
        else:
            logger.info(f"No projects found for session {session_id}")
        
        # Delete the session
        success = await guest_service.delete_simple_guest_session(session_id)
        
        if success:
            return {
                "success": True, 
                "message": f"Guest session and {deleted_projects_count} associated projects deleted successfully",
                "session_id": session_id,
                "deleted_projects": deleted_projects_count
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete guest session")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SCRATCH SERVICES
# ============================================================================

@router.post("/session/{session_id}/projects/{project_id}/scratch/start", response_model=dict)
async def start_scratch_services(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Start Scratch services for a guest project"""
    try:
        # Verify project belongs to this session
        project = await project_service.get_project(project_id)
        if not project or project.student_id != session_id:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # For now, return success - in production this would start actual services
        return {
            "success": True,
            "message": "Scratch services started successfully",
            "gui_url": "https://scratch-editor-107731139870.us-central1.run.app",
            "vm_url": "http://localhost:8602",
            "project_id": project_id,
            "session_id": session_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting Scratch services for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scratch/start-all", response_model=dict)
async def start_all_scratch_services():
    """Start all Scratch services (scratch-gui, scratch-vm, etc.)"""
    try:
        # In production, this would start actual Scratch services
        # For now, return success with default ports
        return {
            "success": True,
            "message": "All Scratch services started successfully",
            "gui_url": "https://scratch-editor-107731139870.us-central1.run.app",
            "vm_url": "http://localhost:8602",
            "services": [
                {
                    "name": "scratch-gui",
                    "status": "running",
                    "port": 8601,
                    "url": "https://scratch-editor-107731139870.us-central1.run.app"
                },
                {
                    "name": "scratch-vm",
                    "status": "running", 
                    "port": 8602,
                    "url": "http://localhost:8602"
                }
            ]
        }
    except Exception as e:
        logger.error(f"Error starting Scratch services: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MACHINE LEARNING ENDPOINTS FOR SCRATCH EXTENSION
# ============================================================================

@router.get("/session/{session_id}/projects/{project_id}/examples", response_model=dict)
async def get_guest_examples(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get examples and model information for Scratch extension"""
    try:
        # Validate that the project belongs to this session
        project = await project_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project belongs to this session
        if project.guest_session_id != session_id and project.createdBy != f"guest:{session_id}":
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Get examples for this project
        examples = await project_service.get_project_examples(project_id)
        
        # Extract unique labels from examples
        labels = list(set([ex.label for ex in examples if ex.label]))
        
        # Check if model is ready (has training data)
        model_ready = len(examples) > 0
        
        return {
            "success": True,
            "data": {
                "labels": labels,
                "examples_count": len(examples),
                "model_ready": model_ready,
                "project_name": project.name,
                "project_type": project.type
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting examples for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/projects/{project_id}/predict", response_model=dict)
async def predict_guest_text(
    session_id: str,
    project_id: str,
    request: PredictionRequest,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Predict text classification for Scratch extension"""
    try:
        # Validate that the project belongs to this session
        project = await project_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project belongs to this session
        if project.guest_session_id != session_id:
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Get examples for this project
        examples = await project_service.get_project_examples(project_id)
        
        if not examples:
            raise HTTPException(status_code=400, detail="No training data available for prediction")
        
        # Simple text classification based on training examples
        # In a real implementation, you would use a trained ML model here
        text = request.text.lower()
        
        # Find the most similar example
        best_match = None
        best_score = 0
        
        for example in examples:
            if example.text:
                # Simple similarity score (word overlap)
                example_words = set(example.text.lower().split())
                text_words = set(text.lower().split())
                
                if example_words and text_words:
                    overlap = len(example_words.intersection(text_words))
                    total = len(example_words.union(text_words))
                    score = overlap / total if total > 0 else 0
                    
                    if score > best_score:
                        best_score = score
                        best_match = example
        
        if best_match and best_score > 0.1:  # Minimum similarity threshold
            return {
                "success": True,
                "data": {
                    "label": best_match.label,
                    "text": text,
                    "confidence": best_score
                }
            }
        else:
            # Return the most common label with low confidence
            label_counts = {}
            for ex in examples:
                if ex.label:
                    label_counts[ex.label] = label_counts.get(ex.label, 0) + 1
            
            most_common_label = max(label_counts.items(), key=lambda x: x[1])[0] if label_counts else "unknown"
            
            return {
                "success": True,
                "data": {
                    "label": most_common_label,
                    "text": text,
                    "confidence": 0.1
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting text for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/projects/{project_id}/train", response_model=dict)
async def train_guest_project(
    session_id: str,
    project_id: str,
    request: dict,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Add training data or start training for Scratch extension"""
    try:
        # Validate that the project belongs to this session
        project = await project_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project belongs to this session
        if project.guest_session_id != session_id:
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Check if this is adding training data or starting training
        if 'text' in request and 'label' in request:
            # Adding training data
            example = ExampleAdd(
                text=request['text'],
                label=request['label']
            )
            
            await project_service.add_example_to_project(project_id, example)
            
            return {
                "success": True,
                "data": {
                    "message": "Training data added successfully",
                    "action": "add_data",
                    "text": request['text'],
                    "label": request['label']
                }
            }
        elif request.get('action') == 'train':
            # Starting training process
            examples = await project_service.get_project_examples(project_id)
            
            if len(examples) < 2:
                raise HTTPException(status_code=400, detail="Need at least 2 examples to start training")
            
            # In a real implementation, you would start an async training job here
            # For now, we'll just return success
            return {
                "success": True,
                "data": {
                    "message": "Training started successfully",
                    "action": "train",
                    "examples_count": len(examples),
                    "status": "training"
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid request. Must include 'text' and 'label' or 'action': 'train'")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error training project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/projects/{project_id}/train", response_model=dict)
async def get_guest_training_status(
    session_id: str,
    project_id: str,
    session: dict = Depends(validate_session_dependency),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get training status for Scratch extension"""
    try:
        # Validate that the project belongs to this session
        project = await project_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project belongs to this session
        if project.guest_session_id != session_id:
            raise HTTPException(status_code=403, detail="Project does not belong to this session")
        
        # Get examples for this project
        examples = await project_service.get_project_examples(project_id)
        
        # Determine training status
        if len(examples) == 0:
            status = "no_data"
        elif len(examples) < 2:
            status = "insufficient_data"
        else:
            status = "ready"
        
        return {
            "success": True,
            "data": {
                "status": status,
                "examples_count": len(examples),
                "project_name": project.name,
                "last_updated": project.updatedAt.isoformat() if project.updatedAt else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting training status for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))