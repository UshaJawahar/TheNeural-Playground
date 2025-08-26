"""
Guest Service - Handles guest session and project operations in Firestore
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from ..models import Guest, GuestCreate, GuestUpdate, GuestSession
from ..config import gcp_clients

logger = logging.getLogger(__name__)


class GuestService:
    """Service for managing guest sessions and their embedded projects"""
    
    def __init__(self):
        # Use the centralized GCP configuration
        self.db = gcp_clients.get_firestore_client()
        # Guest projects are stored in the projects collection, not a separate guests collection
        self.projects_collection = self.db.collection("projects")
        self.session_collection = self.db.collection("guest_sessions")
    
    async def create_guest_session(self, guest_data: GuestCreate, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Guest:
        """Create a new guest session with embedded project data"""
        try:
            # Generate unique IDs
            session_id = f"session_{uuid.uuid4().hex[:16]}"
            project_id = f"proj_{uuid.uuid4().hex[:8]}"
            
            # Calculate expiration time
            expiration_time = datetime.now(timezone.utc) + timedelta(hours=guest_data.session_duration_hours)
            
            # Create guest document with embedded project
            guest = Guest(
                session_id=session_id,
                createdAt=datetime.now(timezone.utc),
                expiresAt=expiration_time,
                active=True,
                ip_address=ip_address,
                user_agent=user_agent,
                last_active=datetime.now(timezone.utc),
                
                # Project data
                project_id=project_id,
                name=guest_data.name,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                status="draft",
                dataset_type=guest_data.dataset_type,
                dataset=[],
                dataset_size=0,
                model_type="logistic_regression",
                model_version=1,
                ml_config={},
                training_status="pending",
                training_logs=[],
                trained_at=None,
                metrics={},
                test_results=[],
                test_accuracy=None,
                last_tested_at=None,
                scratch_api_key=None,
                scratch_enabled=False,
                usage_count=0,
                last_accessed_by=None,
                last_accessed_at=datetime.now(timezone.utc)
            )
            
            # Save to Firestore
            doc_ref = self.collection.document(session_id)
            doc_ref.set(guest.model_dump())
            
            logger.info(f"Created guest session: {session_id} with project: {project_id}")
            return guest
            
        except Exception as e:
            logger.error(f"Error creating guest session: {str(e)}")
            raise
    
    async def get_guest_session(self, session_id: str) -> Optional[Guest]:
        """Get a guest session by ID"""
        try:
            doc_ref = self.collection.document(session_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                return Guest(**data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting guest session {session_id}: {str(e)}")
            raise
    
    async def get_guest_project_by_id(self, project_id: str) -> Optional[Guest]:
        """Get a guest project by project_id - looks in projects collection"""
        try:
            # Query the projects collection to find a project with the given project_id
            query = self.projects_collection.where("id", "==", project_id).limit(1)
            docs = query.stream()
            
            for doc in docs:
                data = doc.to_dict()
                return Guest(**data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting guest project by project_id {project_id}: {str(e)}")
            raise
    
    async def update_guest_session(self, session_id: str, update_data: GuestUpdate) -> Optional[Guest]:
        """Update a guest session"""
        try:
            # Find the project document where student_id matches the session_id
            query = self.projects_collection.where("student_id", "==", session_id).limit(1)
            docs = list(query.stream())
            
            if not docs:
                return None
            
            doc_ref = docs[0].reference
            
            # Prepare update data (only non-None fields)
            update_dict = {}
            for field, value in update_data.model_dump(exclude_unset=True).items():
                if value is not None:
                    update_dict[field] = value
            
            # Always update the timestamp
            update_dict['updatedAt'] = datetime.now(timezone.utc)
            
            # Update document
            doc_ref.update(update_dict)
            
            # Return updated document
            updated_doc = doc_ref.get()
            return Guest(**updated_doc.to_dict())
            
        except Exception as e:
            logger.error(f"Error updating guest session {session_id}: {str(e)}")
            raise
    
    async def delete_guest_session(self, session_id: str) -> bool:
        """Delete a guest session"""
        try:
            doc_ref = self.collection.document(session_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return False
            
            doc_ref.delete()
            logger.info(f"Deleted guest session: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting guest session {session_id}: {str(e)}")
            raise
    
    async def get_active_sessions(self, limit: int = 100) -> List[Guest]:
        """Get all active guest sessions"""
        try:
            query = self.collection.where(
                filter=FieldFilter("active", "==", True)
            ).where(
                filter=FieldFilter("expiresAt", ">", datetime.now(timezone.utc))
            ).limit(limit)
            
            docs = query.stream()
            sessions = []
            
            for doc in docs:
                try:
                    sessions.append(Guest(**doc.to_dict()))
                except Exception as e:
                    logger.warning(f"Error parsing guest session {doc.id}: {str(e)}")
                    continue
            
            return sessions
            
        except Exception as e:
            logger.error(f"Error getting active sessions: {str(e)}")
            raise
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired guest sessions"""
        try:
            current_time = datetime.now(timezone.utc)
            query = self.collection.where(
                filter=FieldFilter("expiresAt", "<=", current_time)
            )
            
            docs = list(query.stream())
            deleted_count = 0
            
            for doc in docs:
                try:
                    doc.reference.delete()
                    deleted_count += 1
                    logger.info(f"Deleted expired session: {doc.id}")
                except Exception as e:
                    logger.warning(f"Error deleting expired session {doc.id}: {str(e)}")
            
            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} expired sessions")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {str(e)}")
            raise
    
    async def add_training_examples(self, session_id: str, examples: List[Dict[str, str]]) -> Optional[Guest]:
        """Add training examples to a guest project"""
        try:
            doc_ref = self.collection.document(session_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
            
            guest_data = doc.to_dict()
            current_dataset = guest_data.get('dataset', [])
            
            # Add new examples
            current_dataset.extend(examples)
            
            # Update document
            update_data = {
                'dataset': current_dataset,
                'dataset_size': len(current_dataset),
                'updated_at': datetime.now(timezone.utc),
                'last_active': datetime.now(timezone.utc)
            }
            
            doc_ref.update(update_data)
            
            # Return updated document
            updated_doc = doc_ref.get()
            return Guest(**updated_doc.to_dict())
            
        except Exception as e:
            logger.error(f"Error adding examples to session {session_id}: {str(e)}")
            raise
    
    async def update_training_status(self, session_id: str, status: str, logs: Optional[List[str]] = None, metrics: Optional[Dict[str, float]] = None) -> Optional[Guest]:
        """Update training status and results for a guest project"""
        try:
            doc_ref = self.collection.document(session_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
            
            update_data = {
                'training_status': status,
                'updated_at': datetime.now(timezone.utc),
                'last_active': datetime.now(timezone.utc)
            }
            
            if logs:
                update_data['training_logs'] = logs
            
            if metrics:
                update_data['metrics'] = metrics
                
            if status == "completed":
                update_data['trained_at'] = datetime.now(timezone.utc)
                update_data['status'] = "trained"
            elif status == "failed":
                update_data['status'] = "failed"
            
            doc_ref.update(update_data)
            
            # Return updated document
            updated_doc = doc_ref.get()
            return Guest(**updated_doc.to_dict())
            
        except Exception as e:
            logger.error(f"Error updating training status for session {session_id}: {str(e)}")
            raise

    async def create_simple_guest_session(self, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> GuestSession:
        """Create a simple guest session with just UUID, created time, and expiry time (7 days)"""
        try:
            # Generate unique session ID and project ID
            session_id = f"session_{uuid.uuid4().hex[:16]}"
            project_id = f"proj_{uuid.uuid4().hex[:8]}"
            
            # Calculate expiration time (7 days from now)
            expiration_time = datetime.now(timezone.utc) + timedelta(days=7)
            
            # Create simple guest session
            guest_session = GuestSession(
                session_id=session_id,
                createdAt=datetime.now(timezone.utc),
                expiresAt=expiration_time,
                active=True,
                ip_address=ip_address,
                user_agent=user_agent,
                last_active=datetime.now(timezone.utc)
            )
            
            # Save simple session to Firestore
            doc_ref = self.session_collection.document(session_id)
            doc_ref.set(guest_session.model_dump())
            
            # Also create a corresponding project in the projects collection
            # This follows the same structure as existing projects in your Firestore
            project_data = {
                "id": project_id,
                "name": "My Project",
                "description": "",
                "type": "text-recognition",
                "status": "draft",
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
                "createdBy": f"guest:{session_id}",
                "teacher_id": "",
                "classroom_id": "",
                "student_id": session_id,  # This links the project to the guest session
                "schoolId": "",
                "classId": "",
                "dataset": {
                    "filename": "",
                    "size": 0,
                    "records": 0,
                    "uploadedAt": None,
                    "gcsPath": "",
                    "examples": [],
                    "labels": []
                },
                "datasets": [],
                "model": {
                    "filename": "",
                    "accuracy": None,
                    "loss": None,
                    "trainedAt": None,
                    "gcsPath": "",
                    "labels": [],
                    "modelType": "logistic_regression",
                    "endpointUrl": ""
                },
                "config": {
                    "epochs": 100,
                    "batchSize": 32,
                    "learningRate": 0.001,
                    "validationSplit": 0.2
                },
                "trainingHistory": [],
                "currentJobId": None,
                "expiryTimestamp": expiration_time,
                "tags": [],
                "notes": ""
            }
            
            # Save project to Firestore
            project_doc_ref = self.projects_collection.document(project_id)
            project_doc_ref.set(project_data)
            
            logger.info(f"Created simple guest session: {session_id} with project: {project_id}")
            return guest_session
            
        except Exception as e:
            logger.error(f"Error creating simple guest session: {str(e)}")
            raise

    async def get_simple_guest_session(self, session_id: str) -> Optional[GuestSession]:
        """Get a simple guest session by ID"""
        try:
            doc_ref = self.session_collection.document(session_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                return GuestSession(**data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting simple guest session {session_id}: {str(e)}")
            raise

    async def validate_session(self, session_id: str) -> GuestSession:
        """Validate a guest session exists and is active"""
        try:
            session = await self.get_simple_guest_session(session_id)
            
            if not session:
                raise ValueError(f"Guest session {session_id} not found")
            
            # Check if session is expired
            current_time = datetime.now(timezone.utc)
            if session.expiresAt <= current_time:
                raise ValueError(f"Guest session {session_id} has expired")
            
            if not session.active:
                raise ValueError(f"Guest session {session_id} is inactive")
            
            # Update last active time
            doc_ref = self.session_collection.document(session_id)
            doc_ref.update({
                'last_active': current_time
            })
            
            return session
            
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            logger.error(f"Error validating session {session_id}: {str(e)}")
            raise ValueError(f"Session validation failed: {str(e)}")

    async def delete_simple_guest_session(self, session_id: str) -> bool:
        """Delete a simple guest session"""
        try:
            doc_ref = self.session_collection.document(session_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return False
            
            doc_ref.delete()
            logger.info(f"Deleted simple guest session: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting simple guest session {session_id}: {str(e)}")
            raise


# Global instance
guest_service = GuestService()