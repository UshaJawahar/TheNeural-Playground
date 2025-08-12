# TheNeural Backend - Cloud Run Deployment Script (PowerShell)
# This script builds and deploys the FastAPI backend to Google Cloud Run

# Exit on error
$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = gcloud config get-value project
$SERVICE_NAME = "theneural-backend"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "Deploying TheNeural Backend to Cloud Run" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Yellow
Write-Host "Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Yellow

# Step 1: Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Blue
docker build -t "${IMAGE_NAME}:latest" .
if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }

# Step 2: Push to Google Container Registry
Write-Host "Pushing image to Container Registry..." -ForegroundColor Blue
docker push "${IMAGE_NAME}:latest"
if ($LASTEXITCODE -ne 0) { throw "Docker push failed" }

# Step 3: Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Blue
gcloud run deploy $SERVICE_NAME `
  --image "${IMAGE_NAME}:latest" `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --service-account "svc-backend@${PROJECT_ID}.iam.gserviceaccount.com" `
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID,ENVIRONMENT=production,FIRESTORE_DATABASE_ID=(default),GCS_BUCKET_NAME=theneural-data,PUBSUB_TOPIC_NAME=train_jobs,CORS_ORIGIN=https://the-neural-playground.vercel.app" `
  --memory 1Gi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 10 `
  --timeout 900 `
  --port 8080

if ($LASTEXITCODE -ne 0) { throw "Cloud Run deployment failed" }

# Step 4: Get the service URL
Write-Host "Deployment completed!" -ForegroundColor Green
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format "value(status.url)"
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Green
Write-Host "API Docs: $SERVICE_URL/docs" -ForegroundColor Green
Write-Host "Health Check: $SERVICE_URL/health" -ForegroundColor Green

# Step 5: Test the deployment
Write-Host "Testing deployment..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$SERVICE_URL/health" -Method Get
    Write-Host "Health check response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "Health check test failed, but deployment may still be successful" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Deployment successful!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update your frontend CORS_ORIGIN to point to: $SERVICE_URL" -ForegroundColor White
Write-Host "   2. Test the API: $SERVICE_URL/docs" -ForegroundColor White
Write-Host "   3. Monitor logs: gcloud run logs tail $SERVICE_NAME --region $REGION" -ForegroundColor White
Write-Host "   4. Scale if needed: gcloud run services update $SERVICE_NAME --region $REGION --max-instances 20" -ForegroundColor White
