# Cloud Run Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Container Startup Timeout

**Problem**: Container fails to start within the allocated timeout period.

**Symptoms**:
- Error: "Revision is not ready and cannot serve traffic"
- Container failed to start and listen on port 8080

**Solutions**:
1. **Pre-download spaCy model** during build time (already implemented)
2. **Increase startup timeout** in Cloud Run configuration
3. **Use startup check script** to verify dependencies before starting

**Commands**:
```bash
# Deploy with longer timeout
gcloud run deploy theneural-backend \
  --image gcr.io/theneural/theneural-backend:latest \
  --platform managed \
  --region us-central1 \
  --timeout 900 \
  --cpu 1 \
  --memory 2Gi \
  --port 8080 \
  --allow-unauthenticated
```

### 2. spaCy Model Download Issues

**Problem**: spaCy model fails to download during container startup.

**Symptoms**:
- Container crashes during model download
- Timeout errors during startup

**Solutions**:
1. **Pre-download during build** (implemented in Dockerfile)
2. **Use smaller model** if needed
3. **Check internet connectivity** in container

**Verification**:
```bash
# Test locally
docker build -t test-backend .
docker run --rm test-backend python startup_check.py
```

### 3. Memory Issues

**Problem**: Container runs out of memory during startup or operation.

**Symptoms**:
- Container crashes with OOM errors
- Slow startup times

**Solutions**:
1. **Increase memory allocation** in Cloud Run
2. **Use smaller spaCy model** (`en_core_web_sm` instead of `en_core_web_lg`)
3. **Optimize dependencies**

**Commands**:
```bash
# Deploy with more memory
gcloud run deploy theneural-backend \
  --image gcr.io/theneural/theneural-backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2
```

### 4. Health Check Failures

**Problem**: Health check endpoint fails, causing deployment issues.

**Symptoms**:
- Health check timeouts
- Service marked as unhealthy

**Solutions**:
1. **Increase health check timeout** (already implemented)
2. **Simplify health check logic**
3. **Add startup delay** for stability

**Health Check Configuration**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
     CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
```

## Deployment Commands

### Standard Deployment
```bash
cd backend
.\deploy.ps1
```

### Deployment with Custom Settings
```bash
# Build and push image
docker build -t gcr.io/theneural/theneural-backend:latest .
docker push gcr.io/theneural/theneural-backend:latest

# Deploy with custom settings
gcloud run deploy theneural-backend \
  --image gcr.io/theneural/theneural-backend:latest \
  --platform managed \
  --region us-central1 \
  --timeout 900 \
  --cpu 2 \
  --memory 4Gi \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars="PYTHONUNBUFFERED=1"
```

### Rollback Deployment
```bash
# List revisions
gcloud run revisions list --service=theneural-backend --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic theneural-backend \
  --to-revisions=theneural-backend-00013-abc=100 \
  --region=us-central1
```

## Debugging Steps

### 1. Check Container Logs
```bash
# View logs for the latest revision
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=theneural-backend" --limit=50
```

### 2. Test Locally
```bash
# Build and test locally
docker build -t test-backend .
docker run --rm -p 8080:8080 test-backend

# Test startup check
docker run --rm test-backend python startup_check.py
```

### 3. Verify Dependencies
```bash
# Check if spaCy model is available
docker run --rm test-backend python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('Success')"
```

### 4. Check Health Endpoint
```bash
# Test health endpoint locally
curl http://localhost:8080/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-08-26T...",
  "service": "TheNeural Backend API",
  "version": "1.0.0",
  "components": {
    "api": "healthy",
    "spacy_model": "available",
    "spacy_test": "working"
  }
}
```

## Environment Variables

### Required Environment Variables
```bash
PYTHONPATH=/app
PORT=8080
PYTHONUNBUFFERED=1
PYTHONDONTWRITEBYTECODE=1
```

### Optional Environment Variables
```bash
PYTHONHASHSEED=random
PYTHONIOENCODING=utf-8
NODE_ENV=production
```

## Performance Optimization

### 1. Container Optimization
- Use Alpine Linux base image (already implemented)
- Multi-stage builds for smaller images
- Remove unnecessary dependencies

### 2. Runtime Optimization
- Pre-download models during build
- Use connection pooling
- Implement caching strategies

### 3. Resource Allocation
- Start with 1 CPU and 2GB memory
- Scale up based on usage patterns
- Monitor resource utilization

## Monitoring and Alerts

### 1. Cloud Run Metrics
- Request count and latency
- Error rates
- Resource utilization

### 2. Custom Metrics
- spaCy model availability
- Training job success rates
- API response times

### 3. Alerting
- High error rates
- Service unavailability
- Resource exhaustion

## Support and Resources

### 1. Google Cloud Documentation
- [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [Container Registry](https://cloud.google.com/container-registry/docs)
- [Cloud Logging](https://cloud.google.com/logging/docs)

### 2. spaCy Documentation
- [spaCy Installation](https://spacy.io/usage)
- [Model Downloads](https://spacy.io/models)
- [Docker Deployment](https://spacy.io/usage/deployment)

### 3. FastAPI Documentation
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Docker Deployment](https://fastapi.tiangolo.com/deployment/docker/)
