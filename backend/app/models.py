from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime, timezone, timedelta
from enum import Enum


class ProjectType(str, Enum):
    TEXT_RECOGNITION = "text-recognition"
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CUSTOM = "custom"


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    QUEUED = "queued"
    TRAINING = "training"
    TRAINED = "trained"
    TESTING = "testing"
    FAILED = "failed"


class TextExample(BaseModel):
    text: str = Field(..., description="Text example")
    label: str = Field(..., description="Label for this example")
    addedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Dataset(BaseModel):
    filename: str = Field("", description="Name of the dataset file")
    size: int = Field(0, description="File size in bytes")
    records: int = Field(0, description="Number of records in the dataset")
    uploadedAt: Optional[datetime] = Field(None, description="When the dataset was uploaded")
    gcsPath: str = Field("", description="GCS path to the dataset file")
    examples: List[TextExample] = Field(default_factory=list, description="Text examples")
    labels: List[str] = Field(default_factory=list, description="Unique labels in dataset")


class TrainedModel(BaseModel):
    filename: str = Field("", description="Name of the model file")
    accuracy: Optional[float] = Field(None, description="Model accuracy score")
    loss: Optional[float] = Field(None, description="Model loss value")
    trainedAt: Optional[datetime] = Field(None, description="When the model was trained")
    gcsPath: str = Field("", description="GCS path to the model file")
    labels: List[str] = Field(default_factory=list, description="Labels the model can predict")
    modelType: str = Field("logistic_regression", description="Type of model used")
    endpointUrl: str = Field("", description="URL for prediction endpoint")


class ProjectConfig(BaseModel):
    epochs: int = Field(100, ge=1, le=10000, description="Number of training epochs")
    batchSize: int = Field(32, ge=1, le=10000, description="Training batch size")
    learningRate: float = Field(0.001, gt=0, le=1, description="Learning rate")
    validationSplit: float = Field(0.2, gt=0, lt=1, description="Validation split ratio")


class Project(BaseModel):
    id: str = Field(..., description="Unique project identifier")
    name: str = Field(..., min_length=1, max_length=100, description="Project name")
    description: str = Field("", max_length=500, description="Project description")
    type: ProjectType = Field(ProjectType.TEXT_RECOGNITION, description="Project type")
    status: ProjectStatus = Field(ProjectStatus.DRAFT, description="Current project status")
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Creation timestamp")
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Last update timestamp")
    createdBy: str = Field("", description="User who created the project")
    
    # School and class information
    schoolId: str = Field("", description="School identifier")
    classId: str = Field("", description="Class identifier")
    
    # Dataset information
    dataset: Dataset = Field(default_factory=lambda: Dataset(), description="Primary dataset")
    datasets: List[Dataset] = Field(default_factory=list, description="List of all datasets")
    
    # Model information
    model: TrainedModel = Field(default_factory=lambda: TrainedModel(), description="Trained model details")
    
    # Training configuration
    config: ProjectConfig = Field(default_factory=lambda: ProjectConfig(), description="Training configuration")
    
    # Training history and job management
    trainingHistory: List[dict] = Field(default_factory=list, description="Training history logs")
    currentJobId: Optional[str] = Field(None, description="Current training job ID")
    
    # Lifecycle management
    expiryTimestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=timezone.utc) + timedelta(days=7),
        description="Project expiry timestamp (default 7 days)"
    )
    
    # Metadata
    tags: List[str] = Field(default_factory=list, description="Project tags")
    notes: str = Field("", max_length=1000, description="Additional notes")


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field("", max_length=500)
    type: ProjectType = Field(ProjectType.TEXT_RECOGNITION)
    createdBy: str = Field("")
    tags: List[str] = Field(default_factory=list)
    notes: str = Field("", max_length=1000)
    config: Optional[ProjectConfig] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    type: Optional[ProjectType] = None
    status: Optional[ProjectStatus] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=1000)
    config: Optional[ProjectConfig] = None


class TrainingConfig(BaseModel):
    epochs: Optional[int] = Field(None, ge=1, le=10000)
    batchSize: Optional[int] = Field(None, ge=1, le=10000)
    learningRate: Optional[float] = Field(None, gt=0, le=1)
    validationSplit: Optional[float] = Field(None, gt=0, lt=1)


class ExampleAdd(BaseModel):
    text: str = Field(..., description="Text example to add")
    label: str = Field(..., description="Label for this example")

class ExamplesBulkAdd(BaseModel):
    examples: List[ExampleAdd] = Field(..., description="List of examples to add")

class DatasetUpload(BaseModel):
    records: Optional[int] = Field(None, ge=0)
    description: Optional[str] = Field("")


class TrainingJob(BaseModel):
    id: str = Field(..., description="Training job identifier")
    projectId: str = Field(..., description="Project ID")
    status: str = Field("queued", description="Job status: queued|training|ready|failed")
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    startedAt: Optional[datetime] = Field(None, description="When training started")
    completedAt: Optional[datetime] = Field(None, description="When training completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    progress: float = Field(0.0, ge=0.0, le=100.0, description="Training progress percentage")
    config: Optional[ProjectConfig] = Field(None, description="Training configuration")
    result: Optional[dict] = Field(None, description="Training results (accuracy, etc.)")

class TrainingJobStatus(str, Enum):
    QUEUED = "queued"
    TRAINING = "training"
    READY = "ready"
    FAILED = "failed"


class FileUploadResponse(BaseModel):
    success: bool
    gcsPath: str


class TrainingResponse(BaseModel):
    success: bool
    message: str
    jobId: Optional[str] = Field(None, description="Training job ID")

class PredictionRequest(BaseModel):
    text: str = Field(..., description="Text to predict")

class PredictionResponse(BaseModel):
    success: bool
    label: str
    confidence: float
    alternatives: List[dict] = Field(default_factory=list, description="Alternative predictions")


class ProjectStatusResponse(BaseModel):
    id: str
    status: ProjectStatus
    dataset: Dataset
    datasets: List[Dataset]
    model: TrainedModel
    updatedAt: datetime


class PaginationInfo(BaseModel):
    limit: int
    offset: int
    total: int


class ProjectListResponse(BaseModel):
    success: bool = True
    data: List[Project]
    pagination: PaginationInfo


class ProjectResponse(BaseModel):
    success: bool = True
    data: Project


class ProjectStatusResponseWrapper(BaseModel):
    success: bool = True
    data: ProjectStatusResponse


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[List[str]] = None
