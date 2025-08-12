#!/bin/bash

# TheNeural Backend - Cloud Run Deployment Script
# This script builds and deploys the FastAPI backend to Google Cloud Run

set -e

# Configuration
PROJECT_ID="theneural"
SERVICE_NAME="theneural-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment of TheNeural Backend to Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📋 Setting GCP project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME:latest .

# Push the image to Container Registry
echo "📤 Pushing image to Container Registry..."
docker push $IMAGE_NAME:latest

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --service-account svc-backend@$PROJECT_ID.iam.gserviceaccount.com \
    --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,NODE_ENV=production \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo "📚 API Documentation: $SERVICE_URL/docs"
echo "🔍 Health Check: $SERVICE_URL/health"

echo ""
echo "🎉 Your FastAPI backend is now running on Cloud Run!"
echo "💡 You can test the API using the endpoints above."
