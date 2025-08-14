import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from google.cloud import firestore
from google.cloud import storage
from google.cloud import pubsub_v1

from ..models import Project, ProjectCreate, ProjectUpdate, Dataset, TrainedModel, ProjectConfig, TextExample, ExampleAdd
from ..config import gcp_clients


class ProjectService:
    """Service layer for project management operations"""
    
    def __init__(self):
        self.collection = gcp_clients.get_projects_collection()
        self.bucket = gcp_clients.get_bucket()
        self.topic_path = gcp_clients.get_topic_path()
        self.pubsub_client = gcp_clients.get_pubsub_client()
    
    async def create_project(self, project_data: ProjectCreate) -> Project:
        """Create a new project"""
        try:
            project_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            
            project = Project(
                id=project_id,
                name=project_data.name,
                description=project_data.description,
                type=project_data.type,
                createdBy=project_data.createdBy,
                tags=project_data.tags,
                notes=project_data.notes,
                config=project_data.config or ProjectConfig(),
                createdAt=now,
                updatedAt=now,
                dataset=Dataset(),  # Initialize with empty dataset
                datasets=[],  # Initialize with empty datasets list
                model=TrainedModel()  # Initialize with empty model
            )
            
            # Convert to dict for Firestore
            project_dict = project.model_dump()
            self.collection.document(project_id).set(project_dict)
            
            return project
        except Exception as e:
            raise Exception(f"Failed to create project: {str(e)}")
    
    async def get_project(self, project_id: str) -> Optional[Project]:
        """Get project by ID"""
        try:
            doc = self.collection.document(project_id).get()
            if doc.exists:
                data = doc.to_dict()
                return Project(**data)
            return None
        except Exception as e:
            raise Exception(f"Failed to get project: {str(e)}")
    
    async def get_projects(
        self, 
        limit: int = 50, 
        offset: int = 0,
        status: Optional[str] = None,
        type: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> List[Project]:
        """Get all projects with optional filtering"""
        try:
            # Start with base query
            query = self.collection.order_by('createdAt', direction=firestore.Query.DESCENDING)
            
            # Apply filters
            if status:
                query = query.where('status', '==', status)
            if type:
                query = query.where('type', '==', type)
            if created_by:
                query = query.where('createdBy', '==', created_by)
            
            # Execute query and get documents
            docs = query.limit(limit).offset(offset).get()
            projects = []
            
            for doc in docs:
                data = doc.to_dict()
                projects.append(Project(**data))
            
            return projects
        except Exception as e:
            raise Exception(f"Failed to get projects: {str(e)}")
    
    async def update_project(self, project_id: str, update_data: ProjectUpdate) -> Project:
        """Update project"""
        try:
            project = await self.get_project(project_id)
            if not project:
                raise Exception("Project not found")
            
            # Update fields
            for field, value in update_data.model_dump(exclude_unset=True).items():
                if hasattr(project, field):
                    setattr(project, field, value)
            
            project.updatedAt = datetime.now(timezone.utc)
            
            # Update Firestore
            project_dict = project.model_dump()
            self.collection.document(project_id).set(project_dict)
            
            return project
        except Exception as e:
            raise Exception(f"Failed to update project: {str(e)}")
    
    async def delete_project(self, project_id: str) -> bool:
        """Delete project by ID"""
        try:
            project = await self.get_project(project_id)
            if not project:
                raise Exception("Project not found")
            
            # Delete from Firestore
            self.collection.document(project_id).delete()
            
            # TODO: Clean up associated files in GCS
            # TODO: Clean up training jobs
            
            return True
        except Exception as e:
            raise Exception(f"Failed to delete project: {str(e)}")
    
    async def delete_multiple_projects(self, project_ids: List[str]) -> int:
        """Delete multiple projects by IDs"""
        try:
            deleted_count = 0
            for project_id in project_ids:
                try:
                    success = await self.delete_project(project_id)
                    if success:
                        deleted_count += 1
                except Exception as e:
                    print(f"Warning: Failed to delete project {project_id}: {str(e)}")
                    continue
            
            return deleted_count
        except Exception as e:
            raise Exception(f"Failed to delete multiple projects: {str(e)}")
    
    async def search_projects(self, search_query: str, filters: Dict[str, Any]) -> List[Project]:
        """Search projects by query and filters"""
        try:
            # Get all projects first (in production, you'd use a search service)
            all_projects = await self.get_projects(limit=1000)
            
            # Apply search filter
            search_lower = search_query.lower()
            filtered_projects = []
            
            for project in all_projects:
                # Check if project matches search query
                if (search_lower in project.name.lower() or 
                    search_lower in project.description.lower() or
                    any(search_lower in tag.lower() for tag in project.tags)):
                    
                    # Apply additional filters
                    matches_filters = True
                    for filter_key, filter_value in filters.items():
                        if hasattr(project, filter_key):
                            project_value = getattr(project, filter_key)
                            if project_value != filter_value:
                                matches_filters = False
                                break
                    
                    if matches_filters:
                        filtered_projects.append(project)
            
            return filtered_projects
        except Exception as e:
            raise Exception(f"Failed to search projects: {str(e)}")
    
    async def upload_dataset(self, project_id: str, file_content: bytes, filename: str, content_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Upload dataset file for a project"""
        try:
            # Get project
            project = await self.get_project(project_id)
            if not project:
                raise Exception("Project not found")
            
            # Generate GCS path
            gcs_path = f"datasets/{project_id}/{filename}"
            
            # Upload to GCS
            blob = self.bucket.blob(gcs_path)
            blob.upload_from_string(file_content, content_type=content_type)
            
            # Update project dataset
            project.dataset.filename = filename
            project.dataset.size = len(file_content)
            project.dataset.uploadedAt = datetime.now(timezone.utc)
            project.dataset.gcsPath = f"gs://{self.bucket.name}/{gcs_path}"
            
            # Update metadata
            if metadata.get('records'):
                project.dataset.records = metadata['records']
            if metadata.get('description'):
                project.dataset.description = metadata['description']
            
            # Update Firestore
            project_dict = project.model_dump()
            self.collection.document(project_id).set(project_dict)
            
            return {
                'success': True,
                'gcsPath': project.dataset.gcsPath
            }
        except Exception as e:
            raise Exception(f"Failed to upload dataset: {str(e)}")
    
    async def add_examples(self, project_id: str, examples: List[ExampleAdd]) -> Dict[str, Any]:
        """Add text examples to a project"""
        try:
            # Get project
            project = await self.get_project(project_id)
            if not project:
                raise Exception("Project not found")
            
            # Get current examples count
            previous_total = len(project.dataset.examples)
            
            # Add new examples
            for example_data in examples:
                # Split comma-separated text into multiple examples
                texts = [text.strip() for text in example_data.text.split(',') if text.strip()]
                
                for text in texts:
                    example = TextExample(
                        text=text,
                        label=example_data.label
                    )
                    project.dataset.examples.append(example)
            
            # Update labels list
            all_labels = set(example.label for example in project.dataset.examples)
            project.dataset.labels = list(all_labels)
            project.dataset.records = len(project.dataset.examples)
            
            # Update Firestore
            project_dict = project.model_dump()
            self.collection.document(project_id).set(project_dict)
            
            return {
                'totalExamples': len(project.dataset.examples),
                'previousTotal': previous_total,
                'labels': project.dataset.labels
            }
        except Exception as e:
            raise Exception(f"Failed to add examples: {str(e)}")
    
    async def get_examples(self, project_id: str) -> List[TextExample]:
        """Get all examples for a project"""
        try:
            project = await self.get_project(project_id)
            if not project:
                raise Exception("Project not found")
            
            return project.dataset.examples
        except Exception as e:
            raise Exception(f"Failed to get examples: {str(e)}")
