# Guest System Delete APIs

This document describes the new API endpoints for deleting trained models and examples in the guest system.

## Overview

The guest system now supports three new DELETE endpoints that allow users to:
1. Delete trained models from Google Cloud Storage (GCS)
2. Delete all examples under a specific label
3. Delete a specific example by index under a label

## API Endpoints

### 1. Delete Trained Model

**Endpoint:** `DELETE /api/guests/projects/{project_id}/model`

**Description:** Deletes a trained model file from Google Cloud Storage and resets the project status.

**Parameters:**
- `project_id` (path): The ID of the project
- `session_id` (query): The guest session ID for authentication

**Request Example:**
```bash
curl -X DELETE "http://localhost:8000/api/guests/projects/proj_123/model?session_id=session_abc123"
```

**Response:**
```json
{
  "success": true,
  "message": "Trained model deleted successfully",
  "project_id": "proj_123",
  "deleted_gcs_path": "bucket-name/models/model_123.pkl"
}
```

**Features:**
- Validates guest session ownership
- Deletes model file from GCS
- Updates project status to "draft"
- Comprehensive logging for debugging

### 2. Delete Examples by Label

**Endpoint:** `DELETE /api/guests/projects/{project_id}/examples/{label}`

**Description:** Deletes all examples under a specific label (e.g., all "happy" examples).

**Parameters:**
- `project_id` (path): The ID of the project
- `label` (path): The label to delete (e.g., "happy", "sad")
- `session_id` (query): The guest session ID for authentication

**Request Example:**
```bash
curl -X DELETE "http://localhost:8000/api/guests/projects/proj_123/examples/happy?session_id=session_abc123"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted 3 examples with label 'happy'",
  "project_id": "proj_123",
  "label": "happy",
  "examples_deleted": 3,
  "examples_before": 5,
  "examples_after": 2
}
```

**Features:**
- Deletes all examples with the specified label
- Updates dataset record count
- Removes label from labels list if no examples remain
- Comprehensive logging

### 3. Delete Specific Example

**Endpoint:** `DELETE /api/guests/projects/{project_id}/examples/{label}/{example_index}`

**Description:** Deletes a specific example by its index within a label group.

**Parameters:**
- `project_id` (path): The ID of the project
- `label` (path): The label containing the example
- `example_index` (path): The index of the example to delete (0-based)
- `session_id` (query): The guest session ID for authentication

**Request Example:**
```bash
curl -X DELETE "http://localhost:8000/api/guests/projects/proj_123/examples/happy/0?session_id=session_abc123"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted example with label 'happy'",
  "project_id": "proj_123",
  "label": "happy",
  "example_index": 0,
  "deleted_example": "I am feeling very happy today!",
  "examples_remaining": 4
}
```

**Features:**
- Deletes specific example by index
- Validates index range
- Updates dataset record count
- Returns preview of deleted example

## Authentication & Security

All endpoints require a valid guest session ID passed as a query parameter. The system:

1. **Validates Session:** Ensures the session exists and is active
2. **Verifies Ownership:** Confirms the project belongs to the guest session
3. **Logs Operations:** Comprehensive logging for audit trails
4. **Error Handling:** Proper HTTP status codes and error messages

## Error Handling

The APIs return appropriate HTTP status codes:

- `200 OK`: Operation successful
- `400 Bad Request`: Invalid parameters or data
- `403 Forbidden`: Project doesn't belong to session
- `404 Not Found`: Project, model, or examples not found
- `410 Gone`: Session expired
- `500 Internal Server Error`: Server-side errors

## Logging

All operations are logged with detailed information:

```python
logger.info(f"Session validated for project {project_id}, session {session_id}")
logger.info(f"Successfully deleted model file from GCS: {gcs_path}")
logger.info(f"Successfully deleted {count} examples with label '{label}' from project {project_id}")
```

## Testing

A comprehensive test script is provided at `test_delete_apis.py` that tests all three endpoints with mocked dependencies.

**Run tests:**
```bash
cd backend
python test_delete_apis.py
```

## Usage Examples

### Frontend Integration

```typescript
// Delete trained model
const deleteModel = async (projectId: string, sessionId: string) => {
  const response = await fetch(
    `/api/guests/projects/${projectId}/model?session_id=${sessionId}`,
    { method: 'DELETE' }
  );
  return response.json();
};

// Delete all examples with a label
const deleteExamplesByLabel = async (projectId: string, label: string, sessionId: string) => {
  const response = await fetch(
    `/api/guests/projects/${projectId}/examples/${label}?session_id=${sessionId}`,
    { method: 'DELETE' }
  );
  return response.json();
};

// Delete specific example
const deleteSpecificExample = async (projectId: string, label: string, index: number, sessionId: string) => {
  const response = await fetch(
    `/api/guests/projects/${projectId}/examples/${label}/${index}?session_id=${sessionId}`,
    { method: 'DELETE' }
  );
  return response.json();
};
```

### Python Client

```python
import requests

# Delete trained model
response = requests.delete(
    f"http://localhost:8000/api/guests/projects/{project_id}/model",
    params={"session_id": session_id}
)

# Delete examples by label
response = requests.delete(
    f"http://localhost:8000/api/guests/projects/{project_id}/examples/{label}",
    params={"session_id": session_id}
)

# Delete specific example
response = requests.delete(
    f"http://localhost:8000/api/guests/projects/{project_id}/examples/{label}/{index}",
    params={"session_id": session_id}
)
```

## Dependencies

The APIs require the following Python packages:
- `fastapi`: Web framework
- `google-cloud-storage`: GCS operations
- `google-cloud-firestore`: Database operations

## Notes

- Models are permanently deleted from GCS
- Examples are removed from the database
- Project status is reset to "draft" after model deletion
- All operations are logged for debugging and audit purposes
- The system handles GCS errors gracefully and continues with database updates
