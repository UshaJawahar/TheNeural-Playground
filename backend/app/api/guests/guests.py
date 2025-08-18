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
    GuestSessionResponse
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
        return {
            "success": True,
            "examples": examples,
            "totalExamples": len(examples)
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