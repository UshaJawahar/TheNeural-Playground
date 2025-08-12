# 🚀 Cloud Run Deployment Guide

This guide shows you how to deploy your TheNeural backend to Google Cloud Run using the `svc-backend` service account.

## 🎯 **Deployment Architecture**

```
GitHub → Cloud Build → Container Registry → Cloud Run
                                    ↓
                              svc-backend@theneural.iam.gserviceaccount.com
```

## 📋 **Prerequisites**

✅ **GCP Setup Complete** (from previous steps)  
✅ **Service Accounts Created**  
✅ **APIs Enabled**  
✅ **GCP CLI Authenticated**  

## 🚀 **Deployment Methods**

### **Method 1: Cloud Build (Recommended)**

1. **Enable Cloud Build API**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Grant Cloud Build Service Account Permissions**:
   ```bash
   # Get the Cloud Build service account
   gcloud projects describe theneural --format="value(projectNumber)"
   
   # Grant permissions (replace PROJECT_NUMBER with actual number)
   gcloud projects add-iam-policy-binding theneural \
     --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
     --role="roles/run.admin"
   
   gcloud projects add-iam-policy-binding theneural \
     --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

3. **Deploy via Cloud Build**:
   ```bash
   cd backend
   gcloud builds submit --config cloudbuild.yaml .
   ```

### **Method 2: Manual Deployment**

1. **Build and Push Image**:
   ```bash
   # Build the image
   docker build -t gcr.io/theneural/theneural-backend:latest .
   
   # Push to Container Registry
   docker push gcr.io/theneural/theneural-backend:latest
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy theneural-backend \
     --image gcr.io/theneural/theneural-backend:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --service-account svc-backend@theneural.iam.gserviceaccount.com \
     --set-env-vars GOOGLE_CLOUD_PROJECT=theneural,NODE_ENV=production \
     --memory 1Gi \
     --cpu 1 \
     --max-instances 10
   ```

## 🔧 **Configuration Details**

### **Service Account Assignment**
- **Service Account**: `svc-backend@theneural.iam.gserviceaccount.com`
- **Permissions**: 
  - `roles/datastore.user` (Firestore)
  - `roles/pubsub.publisher` (Pub/Sub)
  - `roles/storage.objectViewer` (GCS read)

### **Environment Variables**
```env
GOOGLE_CLOUD_PROJECT=theneural
NODE_ENV=production
PORT=8080
FIRESTORE_DATABASE_ID=(default)
GCS_BUCKET_NAME=theneural-data
PUBSUB_TOPIC_NAME=train-jobs
```

### **Resource Allocation**
- **Memory**: 1GB
- **CPU**: 1 vCPU
- **Max Instances**: 10
- **Port**: 8080 (Cloud Run standard)

## 🌐 **CORS Configuration**

Update your frontend CORS origin in the environment:

```env
# For Vercel deployment
CORS_ORIGIN=https://your-app.vercel.app

# For local development
CORS_ORIGIN=http://localhost:3000
```

## 📊 **Monitoring & Health Checks**

### **Health Endpoint**
- **URL**: `https://your-service-url/health`
- **Response**: Service status and GCP configuration

### **Cloud Run Console**
- Monitor logs, metrics, and performance
- View request/response details
- Check service health status

## 🔄 **Continuous Deployment**

### **GitHub Actions Workflow**
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Google Cloud CLI
      uses: google-github-actions/setup-gcloud@v0
      with:
        project_id: theneural
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        export_default_credentials: true
    
    - name: Deploy to Cloud Run
      run: |
        cd backend
        gcloud builds submit --config cloudbuild.yaml .
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Permission Denied**:
   ```bash
   # Verify service account has correct roles
   gcloud projects get-iam-policy theneural \
     --flatten="bindings[].members" \
     --format="table(bindings.role)" \
     --filter="bindings.members:svc-backend@theneural.iam.gserviceaccount.com"
   ```

2. **Service Account Not Found**:
   ```bash
   # List service accounts
   gcloud iam service-accounts list
   ```

3. **API Not Enabled**:
   ```bash
   # Enable required APIs
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

### **Debug Commands**

```bash
# View Cloud Run service details
gcloud run services describe theneural-backend --region=us-central1

# View logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=theneural-backend" --limit=50

# Test the service
curl https://your-service-url/health
```

## 🔒 **Security Best Practices**

✅ **Service Account**: Uses least-privilege `svc-backend` account  
✅ **No Keys**: No JSON keys stored in code or environment  
✅ **IAM**: Proper role-based access control  
✅ **HTTPS**: Automatic SSL/TLS encryption  
✅ **Authentication**: Service-to-service authentication via ADC  

## 📈 **Scaling & Performance**

- **Auto-scaling**: 0 to 10 instances based on demand
- **Cold Start**: ~2-3 seconds for new instances
- **Warm Start**: ~100-200ms for existing instances
- **Memory**: 1GB per instance (adjustable)

## 🔄 **Next Steps**

After successful deployment:

1. **Test API Endpoints**: Verify all endpoints work
2. **Frontend Integration**: Update frontend API base URL
3. **Monitoring Setup**: Configure Cloud Logging and Metrics
4. **Trainer Service**: Deploy ML training worker
5. **Production Hardening**: Add authentication, rate limiting

## 📞 **Support**

- **GCP Console**: Cloud Run service details
- **Cloud Build**: Build logs and history
- **Cloud Logging**: Application logs and errors
- **IAM**: Service account permissions and roles
