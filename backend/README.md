# TheNeural Backend Service

A Node.js/Express backend service that integrates with Google Cloud Platform services for ML project management.

## 🚀 Features

- **Project Management**: Create, read, update, and delete ML projects
- **File Upload**: Upload datasets to Google Cloud Storage
- **Training Jobs**: Queue training jobs via Pub/Sub
- **Real-time Status**: Track project and training status
- **GCP Integration**: Seamless integration with Firestore, GCS, and Pub/Sub

## 🏗️ Architecture

```
Frontend → Backend → GCP Services
           ↓
    ┌─────────────┐
    │   Express   │
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

## 📋 Prerequisites

- Node.js 18+ 
- Google Cloud Platform account
- GCP project with Firestore, GCS, and Pub/Sub enabled
- Service account credentials

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Service Account Setup

✅ **No JSON Keys Required!**  
Your organization's security policy prevents downloading service account keys, which is actually **more secure**.

The backend will use **Application Default Credentials (ADC)** when deployed to Cloud Run with the `svc-backend` service account.

### 3. Environment Configuration

1. **Copy Environment Template**:
   ```bash
   cp env.example .env
   ```

2. **Update `.env` File**:
   ```env
   # GCP Configuration
   GOOGLE_CLOUD_PROJECT=theneural
   # No service account key needed - Cloud Run will use the assigned service account
   
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

## 🚀 Running the Service

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Health Check
```bash
curl http://localhost:8080/health
```

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

📖 **Full deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 API Endpoints

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

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health status |

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
- **TypeScript**: Includes `.ts` interface definitions for frontend integration

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

```bash
npm test
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── gcp.js          # GCP client configuration
│   ├── middleware/
│   │   └── validation.js   # Request validation
│   ├── models/
│   │   └── Project.js      # Project data model
│   ├── routes/
│   │   └── projects.js     # API routes
│   ├── services/
│   │   └── ProjectService.js # Business logic
│   └── server.js           # Main server file
├── service-account-keys/   # GCP service account keys
├── package.json
├── env.example
└── README.md
```

## 🔒 Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Joi schema validation
- **File Type Filtering**: Whitelist allowed file types
- **Size Limits**: File upload size restrictions

## 📊 Monitoring

- **Health Check**: `/health` endpoint
- **Error Logging**: Console and structured logging
- **GCP Integration**: Service account authentication
- **Status Tracking**: Project and training status

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Error**:
   - Verify service account key path in `.env`
   - Check GCP project ID
   - Ensure service account has required roles

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
5. **Deployment**: Cloud Run deployment configuration

## 📞 Support

For issues and questions:
- Check GCP Console for service status
- Review service account permissions
- Verify environment configuration
- Check application logs
