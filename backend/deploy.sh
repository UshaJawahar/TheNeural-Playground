#!/bin/bash

# TheNeural Backend Deployment Script
# This script deploys the backend to Cloud Run using the svc-backend service account

set -e

# Configuration
PROJECT_ID="theneural"
SERVICE_NAME="theneural-backend"
REGION="us-central1"
SERVICE_ACCOUNT="svc-backend@${PROJECT_ID}.iam.gserviceaccount.com"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying TheNeural Backend to Cloud Run..."
echo "📁 Project: ${PROJECT_ID}"
echo "🔧 Service: ${SERVICE_NAME}"
echo "🌍 Region: ${REGION}"
echo "👤 Service Account: ${SERVICE_ACCOUNT}"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Set the project
echo "📋 Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Build and push the Docker image
echo "🔨 Building Docker image..."
docker build -t ${IMAGE_NAME}:latest .

echo "📤 Pushing image to Container Registry..."
docker push ${IMAGE_NAME}:latest

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --service-account ${SERVICE_ACCOUNT} \
    --set-env-vars GOOGLE_CLOUD_PROJECT=${PROJECT_ID},NODE_ENV=production \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")

echo "✅ Deployment complete!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "🔗 Health Check: ${SERVICE_URL}/health"
echo "📊 API Base: ${SERVICE_URL}/api"

# Test the health endpoint
echo "🧪 Testing health endpoint..."
curl -s "${SERVICE_URL}/health" | jq '.' || echo "⚠️  Health check failed or jq not installed"

echo ""
echo "🎉 Your TheNeural backend is now running on Cloud Run!"
echo "📖 Next steps: Update your frontend to use: ${SERVICE_URL}/api"
