#!/usr/bin/env python3
"""
Simple test script for TheNeural Backend API
Run this to verify your setup is working correctly
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8080"
API_BASE = f"{BASE_URL}/api"

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print("🏠 Testing root endpoint...")
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint: {data['message']}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_projects_endpoint():
    """Test the projects endpoint"""
    print("📊 Testing projects endpoint...")
    try:
        response = requests.get(f"{API_BASE}/projects")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Projects endpoint: {len(data['data'])} projects found")
            return True
        else:
            print(f"❌ Projects endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Projects endpoint error: {e}")
        return False

def test_create_project():
    """Test creating a new project"""
    print("➕ Testing project creation...")
    try:
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "description": "Test project created by API test script",
            "type": "text-recognition",
            "createdBy": "test-user",
            "tags": ["test", "api"],
            "notes": "This is a test project"
        }
        
        response = requests.post(
            f"{API_BASE}/projects",
            json=project_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            project_id = data['data']['id']
            print(f"✅ Project created successfully: {project_id}")
            return project_id
        else:
            print(f"❌ Project creation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Project creation error: {e}")
        return None

def test_get_project(project_id):
    """Test getting a project by ID"""
    print(f"📖 Testing get project: {project_id}")
    try:
        response = requests.get(f"{API_BASE}/projects/{project_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Project retrieved: {data['data']['name']}")
            return True
        else:
            print(f"❌ Get project failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get project error: {e}")
        return False

def test_project_status(project_id):
    """Test getting project status"""
    print(f"📊 Testing project status: {project_id}")
    try:
        response = requests.get(f"{API_BASE}/projects/{project_id}/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Project status: {data['data']['status']}")
            return True
        else:
            print(f"❌ Project status failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Project status error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 TheNeural Backend API Test Suite")
    print("=" * 50)
    
    # Test basic endpoints
    health_ok = test_health_endpoint()
    root_ok = test_root_endpoint()
    
    if not health_ok or not root_ok:
        print("❌ Basic endpoints failed. Make sure the server is running.")
        print("💡 Start the server with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8080")
        return
    
    # Test API endpoints
    projects_ok = test_projects_endpoint()
    
    if not projects_ok:
        print("❌ Projects endpoint failed. Check your GCP configuration.")
        return
    
    # Test project creation
    project_id = test_create_project()
    
    if project_id:
        # Test getting the project
        test_get_project(project_id)
        
        # Test project status
        test_project_status(project_id)
    
    print("\n" + "=" * 50)
    print("🎉 Test suite completed!")
    
    if project_id:
        print(f"📝 Test project created with ID: {project_id}")
        print("💡 You can view it in the API docs at: http://localhost:8080/docs")

if __name__ == "__main__":
    main()
