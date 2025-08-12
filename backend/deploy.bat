@echo off
REM TheNeural Backend Deployment Script for Windows
REM This script deploys the backend to Cloud Run using the svc-backend service account

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_ID=theneural
set SERVICE_NAME=theneural-backend
set REGION=us-central1
set SERVICE_ACCOUNT=svc-backend@%PROJECT_ID%.iam.gserviceaccount.com
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo 🚀 Deploying TheNeural Backend to Cloud Run...
echo 📁 Project: %PROJECT_ID%
echo 🔧 Service: %SERVICE_NAME%
echo 🌍 Region: %REGION%
echo 👤 Service Account: %SERVICE_ACCOUNT%

REM Check if gcloud is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" > temp.txt 2>&1
findstr /C:"@" temp.txt > nul
if errorlevel 1 (
    echo ❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login' first.
    del temp.txt
    exit /b 1
)
del temp.txt

REM Set the project
echo 📋 Setting project to %PROJECT_ID%...
gcloud config set project %PROJECT_ID%

REM Build and push the Docker image
echo 🔨 Building Docker image...
docker build -t %IMAGE_NAME%:latest .

echo 📤 Pushing image to Container Registry...
docker push %IMAGE_NAME%:latest

REM Deploy to Cloud Run
echo 🚀 Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME%:latest ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --service-account %SERVICE_ACCOUNT% ^
    --set-env-vars GOOGLE_CLOUD_PROJECT=%PROJECT_ID%,NODE_ENV=production ^
    --memory 1Gi ^
    --cpu 1 ^
    --max-instances 10

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do set SERVICE_URL=%%i

echo ✅ Deployment complete!
echo 🌐 Service URL: %SERVICE_URL%
echo 🔗 Health Check: %SERVICE_URL%/health
echo 📊 API Base: %SERVICE_URL%/api

REM Test the health endpoint
echo 🧪 Testing health endpoint...
curl -s "%SERVICE_URL%/health"

echo.
echo 🎉 Your TheNeural backend is now running on Cloud Run!
echo 📖 Next steps: Update your frontend to use: %SERVICE_URL%/api

pause
