# Downloading Service Account Key

## Step-by-Step Guide

### 1. Access GCP Console
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Select your project: `theneural`

### 2. Navigate to Service Accounts
- In the left sidebar, click **"IAM & Admin"**
- Click **"Service Accounts"**

### 3. Find the Backend Service Account
- Look for: `svc-backend@theneural.iam.gserviceaccount.com`
- Click on the service account name

### 4. Create and Download Key
- Click the **"KEYS"** tab
- Click **"ADD KEY"** → **"Create new key"**
- Choose **"JSON"** format
- Click **"CREATE"**
- The JSON file will automatically download

### 5. Place the Key File
- Create the directory: `mkdir -p service-account-keys`
- Move the downloaded file to: `service-account-keys/svc-backend.json`

### 6. Verify Setup
```bash
cd backend
ls -la service-account-keys/
# Should show: svc-backend.json
```

## Security Notes

⚠️ **IMPORTANT**: Keep your service account key secure!
- Never commit it to version control
- Add `service-account-keys/` to `.gitignore`
- Use environment variables in production
- Rotate keys regularly

## Test the Setup

After placing the key file, test the connection:

```bash
cd backend
npm install
npm run dev
```

Check the health endpoint:
```bash
curl http://localhost:3001/health
```

You should see GCP project information in the response.
