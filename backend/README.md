# TheNeural Backend API

A modern FastAPI-based backend service that integrates with Google Cloud Platform services for ML project management.

## 🚀 Features

- **FastAPI Framework**: Modern, fast web framework with automatic API documentation
- **Project Management**: Full CRUD operations for ML projects
- **File Upload**: Secure dataset uploads to Google Cloud Storage
- **Training Jobs**: Queue training jobs via Pub/Sub
- **Real-time Status**: Track project and training status
- **GCP Integration**: Seamless integration with Firestore, GCS, and Pub/Sub
- **Type Safety**: Full Pydantic model validation and TypeScript-like type checking
- **Auto Documentation**: Interactive API docs at `/docs` and `/redoc`

## 🏗️ Architecture

```
Frontend → FastAPI Backend → GCP Services
            ↓
     ┌─────────────┐
     │   FastAPI   │
     │   Server    │
     └─────────────┘
            ↓
     ┌─────────────┐
     │  Services   │
     │  (Project)  │
     └─────────────┘
            ↓
     ┌─────────────┐
     │   GCP SDK   │
     └─────────────┘
            ↓
     ┌─────────────┐
     │ Firestore   │
     │   GCS       │
     │  Pub/Sub    │
     └─────────────┘
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration and GCP clients
│   ├── models.py            # Pydantic data models
│   ├── services.py          # Business logic layer
│   └── api/
│       ├── __init__.py
│       ├── health.py        # Health check endpoints
│       └── projects.py      # Project management endpoints
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
├── cloudbuild.yaml         # Cloud Build CI/CD
├── env.example             # Environment variables template
└── README.md               # This file
```

## 📋 Prerequisites

- Python 3.11+
- Google Cloud Platform account
- GCP project with Firestore, GCS, and Pub/Sub enabled
- Service account with proper IAM roles

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

1. **Copy Environment Template**:
   ```bash
   cp env.example .env
   ```

2. **Update `.env` File**:
   ```env
   # GCP Configuration
   GOOGLE_CLOUD_PROJECT=theneural
   
   # Service Configuration
   PORT=8080
   NODE_ENV=production
   
   # GCP Resource Names
   FIRESTORE_DATABASE_ID=(default)
   GCS_BUCKET_NAME=theneural-data
   PUBSUB_TOPIC_NAME=train-jobs
   
   # CORS Configuration
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   
   # Security
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

### 3. Service Account Setup

✅ **No JSON Keys Required!**  
Your organization's security policy prevents downloading service account keys, which is actually **more secure**.

The backend will use **Application Default Credentials (ADC)** when deployed to Cloud Run with the `svc-backend` service account.

## 🚀 Running the Service

### Development Mode
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### Production Mode
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### Health Check
```bash
curl http://localhost:8080/health
```

### API Documentation
- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

## 🚀 **Deployment to Cloud Run**

### **Quick Deploy**
```bash
cd backend
gcloud builds submit --config cloudbuild.yaml .
```

### **Manual Deploy**
```bash
# Build and push image
docker build -t gcr.io/theneural/theneural-backend:latest .
docker push gcr.io/theneural/theneural-backend:latest

# Deploy to Cloud Run
gcloud run deploy theneural-backend \
  --image gcr.io/theneural/theneural-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account svc-backend@theneural.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_CLOUD_PROJECT=theneural,NODE_ENV=production
```

## 📚 API Endpoints

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information |
| `GET` | `/health` | Health check |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | Get all projects |
| `GET` | `/api/projects/:id` | Get project by ID |
| `POST` | `/api/projects` | Create new project |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `POST` | `/api/projects/:id/dataset` | Upload dataset |
| `POST` | `/api/projects/:id/train` | Start training |
| `GET` | `/api/projects/:id/status` | Get project status |

## 🔧 Configuration

### GCP Services

- **Firestore**: Database for project metadata
- **GCS**: File storage for datasets and models
- **Pub/Sub**: Message queue for training jobs

### Type Compatibility

The backend is designed to work seamlessly with your Next.js frontend:

- **Project Types**: Matches frontend `Project` interface exactly
- **Status Values**: `draft` | `training` | `trained` | `testing`
- **Project Types**: `text-recognition` | `classification` | `regression` | `custom`
- **Datasets**: Supports both single `dataset` and `datasets[]` array
- **Pydantic Models**: Automatic validation and serialization

### File Upload

- **Supported Formats**: CSV, JSON, Excel, Text
- **Maximum Size**: 100MB per file
- **Storage Path**: `gs://theneural-data/datasets/{projectId}/{filename}`

### Training Configuration

- **Epochs**: 1-10,000
- **Batch Size**: 1-10,000
- **Learning Rate**: 0.001 (default)
- **Validation Split**: 0.2 (default)

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Test API Endpoints
```bash
# Start the server
uvicorn app.main:app --reload

# Test health endpoint
curl http://localhost:8080/health

# Test projects endpoint
curl http://localhost:8080/api/projects
```

## 🔒 Security

- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Pydantic schema validation
- **File Type Filtering**: Whitelist allowed file types
- **Size Limits**: File upload size restrictions
- **Trusted Hosts**: Host validation middleware

## 📊 Monitoring

- **Health Check**: `/health` endpoint
- **Request Timing**: `X-Process-Time` header
- **Error Logging**: Structured logging with error details
- **GCP Integration**: Service account authentication
- **Status Tracking**: Project and training status

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Error**:
   - Verify GCP project ID in `.env`
   - Check service account has required roles
   - Ensure API is enabled

2. **File Upload Fails**:
   - Check file size (max 100MB)
   - Verify file format is supported
   - Ensure GCS bucket exists and is accessible

3. **Firestore Connection Error**:
   - Verify Firestore database exists
   - Check service account permissions
   - Ensure API is enabled

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and logging.

## 🔄 Next Steps

1. **Trainer Service**: Implement ML training worker
2. **Inference Service**: Model prediction endpoint
3. **Cleanup Service**: Automated data lifecycle management
4. **Monitoring**: Cloud Logging and Metrics integration
5. **Testing**: Comprehensive test suite

## 📞 Support

For issues and questions:
- Check GCP Console for service status
- Review service account permissions
- Verify environment configuration
- Check application logs
- View API documentation at `/docs`

## 🎯 Key Benefits of FastAPI

- **Performance**: One of the fastest Python frameworks available
- **Type Safety**: Full type hints and validation with Pydantic
- **Auto Documentation**: Interactive API docs with OpenAPI/Swagger
- **Modern Python**: Async/await support and modern Python features
- **Easy Testing**: Built-in testing support and dependency injection
- **Production Ready**: Built for production with proper error handling
