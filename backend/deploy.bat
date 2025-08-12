@echo off
REM TheNeural Backend - Cloud Run Deployment Script for Windows
REM This script builds and deploys the FastAPI backend to Google Cloud Run

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_ID=theneural
set SERVICE_NAME=theneural-backend
set REGION=us-central1
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo 🚀 Starting deployment of TheNeural Backend to Cloud Run...

REM Check if gcloud is installed
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: gcloud CLI is not installed. Please install it first.
    exit /b 1
)

REM Check if docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not installed. Please install it first.
    exit /b 1
)

REM Set the project
echo 📋 Setting GCP project to: %PROJECT_ID%
gcloud config set project %PROJECT_ID%

REM Build the Docker image
echo 🔨 Building Docker image...
docker build -t %IMAGE_NAME%:latest .

REM Push the image to Container Registry
echo 📤 Pushing image to Container Registry...
docker push %IMAGE_NAME%:latest

REM Deploy to Cloud Run
echo 🚀 Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME%:latest ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --service-account svc-backend@%PROJECT_ID%.iam.gserviceaccount.com ^
    --set-env-vars GOOGLE_CLOUD_PROJECT=%PROJECT_ID%,NODE_ENV=production ^
    --memory 1Gi ^
    --cpu 1 ^
    --max-instances 10

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do set SERVICE_URL=%%i

echo ✅ Deployment completed successfully!
echo 🌐 Service URL: %SERVICE_URL%
echo 📚 API Documentation: %SERVICE_URL%/docs
echo 🔍 Health Check: %SERVICE_URL%/health

echo.
echo 🎉 Your FastAPI backend is now running on Cloud Run!
echo 💡 You can test the API using the endpoints above.

endlocal
