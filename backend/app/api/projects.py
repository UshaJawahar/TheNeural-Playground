from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Depends
from typing import List, Optional
import json

from ..models import (
    Project, ProjectCreate, ProjectUpdate, ProjectListResponse, 
    ProjectResponse, ProjectStatusResponseWrapper, TrainingConfig,
    FileUploadResponse, TrainingResponse, ErrorResponse,
    ExampleAdd, ExamplesBulkAdd, PredictionRequest, PredictionResponse
)
from ..services import ProjectService
from ..training_service import trainer

router = APIRouter(prefix="/api/projects", tags=["projects"])


# Dependency to get project service
def get_project_service():
    return ProjectService()


@router.get("/", response_model=ProjectListResponse)
async def get_projects(
    limit: int = Query(50, ge=1, le=100, description="Number of projects to return"),
    offset: int = Query(0, ge=0, description="Number of projects to skip"),
    status: Optional[str] = Query(None, description="Filter by project status"),
    type: Optional[str] = Query(None, description="Filter by project type"),
    created_by: Optional[str] = Query(None, description="Filter by creator"),
    search: Optional[str] = Query(None, description="Search query"),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get all projects with optional filtering and search"""
    try:
        if search:
            filters = {}
            if status:
                filters['status'] = status
            if type:
                filters['type'] = type
            if created_by:
                filters['createdBy'] = created_by
            
            projects = await project_service.search_projects(search, filters)
            total = len(projects)
            # Apply pagination
            projects = projects[offset:offset + limit]
        else:
            projects = await project_service.get_projects(limit, offset, status, type, created_by)
            total = len(projects)  # In production, you'd get total count separately
        
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


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    project_service: ProjectService = Depends(get_project_service)
):
    """Get project by ID"""
    try:
        project = await project_service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return ProjectResponse(data=project)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    project_data: ProjectCreate,
    project_service: ProjectService = Depends(get_project_service)
):
    """Create a new project"""
    try:
        project = await project_service.create_project(project_data)
        return ProjectResponse(data=project)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    project_service: ProjectService = Depends(get_project_service)
):
    """Update project"""
    try:
        project = await project_service.update_project(project_id, project_data)
        return ProjectResponse(data=project)
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Project not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete project"""
    try:
        await project_service.delete_project(project_id)
        return {"success": True, "message": "Project deleted successfully"}
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Project not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/dataset", response_model=FileUploadResponse)
async def upload_dataset(
    project_id: str,
    file: UploadFile = File(..., description="Dataset file to upload"),
    records: Optional[int] = Form(None, description="Number of records in dataset"),
    description: Optional[str] = Form("", description="Dataset description"),
    project_service: ProjectService = Depends(get_project_service)
):
    """Upload dataset file for a project"""
    try:
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
            'contentType': file.content_type
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


@router.post("/{project_id}/train", response_model=TrainingResponse)
async def start_training(
    project_id: str,
    training_config: Optional[TrainingConfig] = None,
    project_service: ProjectService = Depends(get_project_service)
):
    """Start training job for a project"""
    try:
        result = await project_service.start_training(project_id, training_config)
        return TrainingResponse(
            success=result['success'],
            message=result['message']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/status", response_model=ProjectStatusResponseWrapper)
async def get_project_status(
    project_id: str,
    project_service: ProjectService = Depends(get_project_service)
):
    """Get project status and metadata"""
    try:
        project = await project_service.get_project(project_id)
        if not project:
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
