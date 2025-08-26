'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../../components/Header';
import config from '../../../../../lib/config';
import { 
  getSessionIdFromMaskedId, 
  isMaskedId, 
  isSessionId, 
  getOrCreateMaskedId,
  getProjectIdFromMaskedId,
  isMaskedProjectId,
  isProjectId
} from '../../../../../lib/session-utils';
import { cleanupSessionWithReason, SessionCleanupReason } from '../../../../../lib/session-cleanup';

interface GuestSession {
  session_id: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
  ip_address?: string;
  user_agent?: string;
  last_active?: string;
}

interface GuestSessionResponse {
  success: boolean;
  data: GuestSession;
}

interface Project {
  id: string;
  name: string;
  model_type: string;
  createdAt: string;
  description?: string;
  status?: string;
  maskedId?: string;
}

interface DatasetExample {
  text: string;
  label: string;
  addedAt: string;
}

interface Dataset {
  filename: string;
  size: number;
  records: number;
  uploadedAt: string | null;
  gcsPath: string;
  examples: DatasetExample[];
  labels: string[];
}

interface ProjectDetailResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    description: string;
    model_type: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    dataset: Dataset;
    // ... other fields
  };
}

interface Example {
  id: string;
  text: string;
  createdAt: string;
}

interface Label {
  id: string;
  name: string;
  examples: Example[];
  createdAt: string;
}

interface TrainedModel {
  id: string;
  status: 'training' | 'available' | 'failed';
  startedAt: Date;
  expiresAt: Date;
  testResults?: Array<{
    text: string;
    prediction: string;
    confidence: number;
  }>;
}

interface TrainingJob {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'ready' | 'failed';
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  progress: number;
  config: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    validationSplit: number;
  };
  result?: {
    total_features: number;
    feature_importance: {
      [label: string]: string[];
    };
    labels: string[];
    accuracy: number;
    validation_examples: number;
    training_examples: number;
  };
}

interface TrainingStatusResponse {
  success: boolean;
  projectStatus: 'untrained' | 'training' | 'trained' | 'failed';
  currentJob: TrainingJob | null;
  allJobs: TrainingJob[];
  totalJobs: number;
}

interface PredictionResponse {
  success: boolean;
  label: string;
  confidence: number;
  alternatives: Array<{
    label: string;
    confidence: number;
  }>;
}

export default function LearnPage() {
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actualSessionId, setActualSessionId] = useState<string>('');
  const [actualProjectId, setActualProjectId] = useState<string>('');
  const [trainingStats, setTrainingStats] = useState({
    totalExamples: 0,
    totalLabels: 0,
    labelBreakdown: [] as { name: string; count: number }[]
  });
  const [isTraining, setIsTraining] = useState(false);
  const [trainedModel, setTrainedModel] = useState<TrainedModel | null>(null);
  const [currentTrainingJob, setCurrentTrainingJob] = useState<TrainingJob | null>(null);
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<{
    text: string;
    prediction: string;
    confidence: number;
    alternatives?: Array<{
      label: string;
      confidence: number;
    }>;
  } | null>(null);
  const [isTestingModel, setIsTestingModel] = useState(false);
  const [isDeletingModel, setIsDeletingModel] = useState(false);

  const params = useParams();
  const urlUserId = params?.userid as string;
  const urlProjectId = params?.projectid as string;

  useEffect(() => {
    validateGuestSession();
  }, [urlUserId, urlProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateGuestSession = async () => {
    if (!urlUserId || !urlProjectId) {
      setIsLoading(false);
      return;
    }

    try {
      let sessionId: string;
      let projectId: string;

      // Check if URL param is a masked ID or full session ID
      if (isMaskedId(urlUserId)) {
        const realSessionId = getSessionIdFromMaskedId(urlUserId);
        if (!realSessionId) {
          window.location.href = '/projects';
          return;
        }
        sessionId = realSessionId;
      } else if (isSessionId(urlUserId)) {
        const maskedId = getOrCreateMaskedId(urlUserId);
        window.location.href = `/projects/${maskedId}/${urlProjectId}/learn`;
          return;
        } else {
        window.location.href = '/projects';
        return;
      }

      // Check if project ID is masked
      if (isMaskedProjectId(urlProjectId)) {
        const realProjectId = getProjectIdFromMaskedId(urlProjectId);
        if (!realProjectId) {
          window.location.href = `/projects/${urlUserId}`;
          return;
        }
        projectId = realProjectId;
      } else if (isProjectId(urlProjectId)) {
        projectId = urlProjectId;
      } else {
        window.location.href = `/projects/${urlUserId}`;
        return;
      }

      // Check if session exists in localStorage
      const storedSessionId = localStorage.getItem('neural_playground_session_id');
      
      if (!storedSessionId) {
        window.location.href = '/projects';
        return;
      }

      if (storedSessionId !== sessionId) {
        const correctMaskedId = getOrCreateMaskedId(storedSessionId);
        window.location.href = `/projects/${correctMaskedId}`;
        return;
      }

      // Validate session with backend API
      const response = await fetch(`${config.apiBaseUrl}${config.api.guests.sessionById(sessionId)}`);
      
      if (response.ok) {
        const sessionResponse: GuestSessionResponse = await response.json();
        if (sessionResponse.success && sessionResponse.data.active) {
          const now = new Date();
          const expiresAt = new Date(sessionResponse.data.expiresAt);
          
          if (now < expiresAt) {
            setActualSessionId(sessionId);
            setActualProjectId(projectId);
            setGuestSession(sessionResponse.data);
            setIsValidSession(true);
            
            // Load project and training data after setting session as valid
            await loadProjectAndTrainingData(sessionId, projectId);
          } else {
            console.error('Session expired');
            await cleanupSessionWithReason(SessionCleanupReason.EXPIRED_BACKEND);
            window.location.href = '/projects';
            return;
          }
        } else {
          console.error('Session inactive');
          await cleanupSessionWithReason(SessionCleanupReason.INACTIVE_BACKEND);
          window.location.href = '/projects';
          return;
        }
      } else {
        console.error('Session validation failed:', response.status);
        await cleanupSessionWithReason(SessionCleanupReason.NOT_FOUND_BACKEND);
        window.location.href = '/projects';
        return;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      await cleanupSessionWithReason(SessionCleanupReason.ERROR_FALLBACK);
      window.location.href = '/projects';
      return;
    }
    setIsLoading(false);
  };

  const loadProjectAndTrainingData = async (sessionId: string, projectId: string) => {
    try {
      console.log('Loading project and training data for:', projectId);
      
      // Load project data with dataset from the specific project API
      const response = await fetch(`${config.apiBaseUrl}${config.api.guests.projectById(sessionId, projectId)}`);
      
      if (response.ok) {
        const projectResponse: ProjectDetailResponse = await response.json();
        console.log('Project response:', projectResponse);
        
        if (projectResponse.success && projectResponse.data) {
          const projectData = projectResponse.data;
          console.log('Found project with dataset:', projectData);
          
          // Set the project
          setSelectedProject({
            id: projectData.id,
            name: projectData.name,
            model_type: projectData.model_type,
            createdAt: projectData.createdAt,
            description: projectData.description,
            status: projectData.status
          });

          // Process the dataset to calculate training statistics
          if (projectData.dataset && projectData.dataset.examples) {
            const examples = projectData.dataset.examples;
            const labels = projectData.dataset.labels || [];
            
            console.log('Dataset examples:', examples.length);
            console.log('Dataset labels:', labels);
            
            // Group examples by label and count them
            const labelCounts: { [key: string]: number } = {};
            examples.forEach(example => {
              labelCounts[example.label] = (labelCounts[example.label] || 0) + 1;
            });
            
            // Create label breakdown for display
            const labelBreakdown = labels.map(labelName => ({
              name: labelName,
              count: labelCounts[labelName] || 0
            }));
            
            // Set training statistics from API data
        setTrainingStats({
              totalExamples: examples.length,
              totalLabels: labels.length,
              labelBreakdown
            });

            console.log('Training stats calculated:', {
              totalExamples: examples.length,
              totalLabels: labels.length,
          labelBreakdown
        });
          } else {
            console.log('No dataset found in project response');
            // Set empty stats if no dataset
            setTrainingStats({
              totalExamples: 0,
              totalLabels: 0,
              labelBreakdown: []
            });
          }
        } else {
          console.error('Invalid project response structure');
          window.location.href = `/projects/${urlUserId}`;
          return;
        }
      } else {
        console.error('Failed to load project details:', response.status);
        window.location.href = `/projects/${urlUserId}`;
        return;
      }

      // Load trained model if exists (still from localStorage for now)
      const modelKey = `neural_playground_model_${sessionId}_${projectId}`;
      const savedModel = localStorage.getItem(modelKey);
      if (savedModel) {
        const modelData = JSON.parse(savedModel);
        // Convert string dates back to Date objects
        const trainedModel: TrainedModel = {
          ...modelData,
          startedAt: new Date(modelData.startedAt),
          expiresAt: new Date(modelData.expiresAt)
        };
        setTrainedModel(trainedModel);
      }
    } catch (error) {
      console.error('Error loading project and training data:', error);
      window.location.href = `/projects/${urlUserId}`;
    }
  };

  // Function to fetch training status from API
  const fetchTrainingStatus = async () => {
    if (!actualSessionId || !actualProjectId) return;
    
    try {
      console.log('🔍 Checking training status...');
      
      const response = await fetch(`${config.apiBaseUrl}${config.api.guests.trainingStatus(actualSessionId, actualProjectId)}`);
      
      if (response.ok) {
        const statusData: TrainingStatusResponse = await response.json();
        console.log('📊 Training status response:', statusData);
        
        if (statusData.success) {
          const { projectStatus, currentJob } = statusData;
          
          // Update current training job
          setCurrentTrainingJob(currentJob);
          
          // Update training state based on project status and current job
          if (projectStatus === 'training' && currentJob) {
            setIsTraining(true);
            
            // Check if training is complete
            if (currentJob.status === 'ready' && currentJob.completedAt) {
              // Training completed successfully
              setIsTraining(false);
              
              const completedModel: TrainedModel = {
                id: currentJob.id,
                status: 'available',
                startedAt: new Date(currentJob.startedAt || currentJob.createdAt),
                expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
              };
              
              setTrainedModel(completedModel);
              
              // Save to localStorage
              const modelKey = `neural_playground_model_${actualSessionId}_${actualProjectId}`;
              localStorage.setItem(modelKey, JSON.stringify(completedModel));
            }
          } else if (projectStatus === 'trained' && currentJob && currentJob.status === 'ready') {
            // Project already has a trained model
            setIsTraining(false);
            
            const existingModel: TrainedModel = {
              id: currentJob.id,
              status: 'available',
              startedAt: new Date(currentJob.startedAt || currentJob.createdAt),
              expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
            };
            
            setTrainedModel(existingModel);
          } else if (projectStatus === 'failed' || (currentJob && currentJob.status === 'failed')) {
            // Training failed
            setIsTraining(false);
            setTrainedModel(null);
            setCurrentTrainingJob(null);
          }
        }
      } else {
        console.error('❌ Failed to fetch training status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching training status:', error);
    }
  };

  // Polling interval for training status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (actualSessionId && actualProjectId) {
      // Initial status check
      fetchTrainingStatus();
      
      // Set up polling when training is in progress
      if (isTraining || currentTrainingJob?.status === 'running' || currentTrainingJob?.status === 'pending') {
        pollInterval = setInterval(fetchTrainingStatus, 2000); // Poll every 2 seconds
      }
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [actualSessionId, actualProjectId, isTraining, currentTrainingJob?.status]);



  const handleTrainModel = async () => {
    console.log('🎯 handleTrainModel called');
    console.log('📊 Training stats:', trainingStats);
    console.log('✅ canTrainModel:', canTrainModel);
    
    if (!canTrainModel) {
      console.log('❌ Training requirements not met');
      alert(`Cannot train model yet. You need at least 6 examples and 2 labels. Current: ${trainingStats.totalExamples} examples, ${trainingStats.totalLabels} labels`);
      return;
    }
    
    if (!actualSessionId || !actualProjectId) {
      console.log('❌ Missing session or project ID');
      alert('Missing session or project information. Please refresh the page.');
      return;
    }
    
    setIsTraining(true);
    
    try {
      console.log('🚀 Starting model training via API');
      console.log('Session ID:', actualSessionId);
      console.log('Project ID:', actualProjectId);
      
      // Training configuration payload
      const trainingConfig = {
        epochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2
      };
      
      console.log('📋 Training config:', trainingConfig);
      
      const apiUrl = `${config.apiBaseUrl}${config.api.guests.trainModel(actualSessionId, actualProjectId)}`;
      console.log('🌐 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingConfig),
      });
      
      console.log('📤 Training API Response Status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Training started successfully:', result);
        
        // Create model object for UI
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
        
        const newModel: TrainedModel = {
          id: result.jobId || `model-${Date.now()}`,
          status: 'training',
          startedAt: now,
          expiresAt: expiresAt
        };
        
        setTrainedModel(newModel);
        
        // Start polling for status updates - the API will handle the actual training
        // setIsTraining will remain true until the polling detects completion
        
      } else {
        console.error('❌ Training API failed:', response.status);
        
        let errorDetails;
        try {
          errorDetails = await response.json();
          console.error('📋 Error Details:', errorDetails);
        } catch (jsonError) {
          const errorText = await response.text();
          console.error('📝 Error Text:', errorText);
          errorDetails = { message: errorText };
        }
        
        // Show user-friendly error
        if (response.status === 422) {
          const errorMsg = errorDetails.message || 'Invalid training configuration';
          alert(`Training Error: ${errorMsg}`);
        } else if (response.status === 404) {
          alert('Training endpoint not found. Please check if the server is running.');
        } else if (response.status === 500) {
          alert('Server error during training. Please try again later.');
        } else {
          alert(`Training failed (${response.status}): ${errorDetails.message || 'Unknown error'}`);
        }
        
        setIsTraining(false);
      }
    } catch (error) {
      console.error('❌ Network error during training:', error);
      alert('Network error: Failed to connect to the training server. Please check your connection.');
      setIsTraining(false);
    }
  };

  const handleGoToTrain = () => {
    window.location.href = `/projects/${urlUserId}/${urlProjectId}/train`;
  };

  const handleDeleteModel = async () => {
    if (!actualSessionId || !actualProjectId) return;
    
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this trained model? This action cannot be undone and will permanently remove the model from Google Cloud Storage.')) {
      return;
    }
    
    setIsDeletingModel(true);
    
    try {
      console.log('🗑️ Deleting model via API');
      console.log('Session ID:', actualSessionId);
      console.log('Project ID:', actualProjectId);
      
      const response = await fetch(`${config.apiBaseUrl}${config.api.guests.deleteModel(actualProjectId, actualSessionId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🗑️ Delete API Response Status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Model deleted successfully:', result);
        
        // Clear local storage
        const modelKey = `neural_playground_model_${actualSessionId}_${actualProjectId}`;
        localStorage.removeItem(modelKey);
        
        // Update UI state
        setTrainedModel(null);
        setTestResult(null);
        setCurrentTrainingJob(null);
        
        // Show success message
        alert('Model deleted successfully! The model has been removed from Google Cloud Storage and the project status has been reset to draft.');
      } else {
        console.error('❌ Delete API failed:', response.status);
        
        let errorDetails;
        try {
          errorDetails = await response.json();
          console.error('📋 Error Details:', errorDetails);
        } catch (jsonError) {
          const errorText = await response.text();
          console.error('📝 Error Text:', errorText);
          errorDetails = { detail: errorText };
        }
        
        // Show user-friendly error
        if (response.status === 404) {
          alert('Model not found. It may have already been deleted.');
        } else if (response.status === 403) {
          alert('Access denied. You do not have permission to delete this model.');
        } else if (response.status === 500) {
          alert('Server error occurred while deleting the model. Please try again later.');
        } else {
          alert(`Failed to delete model (${response.status}): ${errorDetails.detail || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('❌ Network error during model deletion:', error);
      alert('Network error: Failed to connect to the server. Please check your connection and try again.');
    } finally {
      setIsDeletingModel(false);
    }
  };

  const handleTrainNewModel = async () => {
    // Clear previous model state
    setTrainedModel(null);
    setTestResult(null);
    
    // Start training the new model
    await handleTrainModel();
  };

  // Test function to check if training API is accessible
  const testTrainingAPI = async () => {
    if (!actualSessionId || !actualProjectId) {
      alert('Missing session or project ID');
      return;
    }
    
    try {
      console.log('🧪 Testing training API endpoint...');
      const apiUrl = `${config.apiBaseUrl}${config.api.guests.trainModel(actualSessionId, actualProjectId)}`;
      console.log('🌐 Testing URL:', apiUrl);
      
      // Test with OPTIONS request to check if endpoint exists
      const response = await fetch(apiUrl, {
        method: 'OPTIONS'
      });
      
      console.log('🧪 OPTIONS response status:', response.status);
      console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()));
      
      alert(`Training API test: ${response.status === 200 ? '✅ Endpoint accessible' : '❌ Endpoint not accessible (Status: ' + response.status + ')'}`);
      
    } catch (error) {
      console.error('🧪 API test error:', error);
      alert('❌ API test failed: ' + error);
    }
  };

  const handleTestModel = async () => {
    if (!testText.trim() || !trainedModel || !actualSessionId || !actualProjectId) return;

    // Check if we have a completed training job
    if (!currentTrainingJob || currentTrainingJob.status !== 'ready') {
      console.warn('⚠️ Model not ready for predictions. Training job status:', currentTrainingJob?.status);
      alert('Model is not ready for predictions yet. Please wait for training to complete.');
      return;
    }

    setIsTestingModel(true);
    
    try {
      console.log('🔮 ===== PREDICTION REQUEST DEBUG =====');
      console.log('Text to predict:', testText);
      console.log('Text length:', testText.trim().length);
      console.log('Session ID:', actualSessionId);
      console.log('Project ID:', actualProjectId);
      console.log('Trained Model:', trainedModel);
      console.log('Current Training Job:', currentTrainingJob);
      
      const requestUrl = `${config.apiBaseUrl}${config.api.guests.predict(actualSessionId, actualProjectId)}`;
      console.log('Full request URL:', requestUrl);
      
      const requestPayload = {
        text: testText.trim()
      };
      console.log('Request payload:', requestPayload);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('🔮 Prediction API response status:', response.status);
      console.log('🔮 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseText = await response.text();
        console.log('🔮 Raw response text:', responseText);
        
        try {
          const predictionData: PredictionResponse = JSON.parse(responseText);
          console.log('🔮 Parsed prediction response:', predictionData);

          if (predictionData.success && predictionData.label && typeof predictionData.confidence === 'number') {
    const newResult = {
      text: testText,
              prediction: predictionData.label,
              confidence: Math.round(predictionData.confidence * 100) / 100,
              alternatives: predictionData.alternatives || []
    };
    
            setTestResult(newResult);
    setTestText('');
            
            console.log('✅ Prediction successful:', newResult);
            console.log('📊 Prediction alternatives:', predictionData.alternatives);
          } else {
            console.error('❌ Prediction failed: Invalid response format');
            console.error('Response success:', predictionData.success);
            console.error('Response label:', predictionData.label);
            console.error('Response confidence:', predictionData.confidence);
            alert('Failed to get prediction. Invalid response format from server.');
          }
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.error('Response was not valid JSON:', responseText);
          alert('Failed to parse prediction response. Server returned invalid data.');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Prediction API failed:', response.status);
        console.error('❌ Error response body:', errorText);
        
        let errorMessage = 'Failed to get prediction. ';
        if (response.status === 404) {
          errorMessage += 'Model not found or not ready.';
        } else if (response.status === 422) {
          errorMessage += 'Invalid input text.';
        } else if (response.status === 500) {
          errorMessage += 'Server error occurred.';
        } else {
          errorMessage += `HTTP ${response.status}: ${errorText || 'Unknown error'}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ Network/fetch error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsTestingModel(false);
      console.log('🔮 ===== PREDICTION REQUEST END =====');
    }
  };

  const handleDescribeModel = () => {
    // This could open a modal or navigate to a description page
    console.log('Describe model clicked');
  };

  // Check if training requirements are met
  const canTrainModel = trainingStats.totalExamples >= 6 && trainingStats.totalLabels >= 2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-white text-xl">Loading...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Session Expired
            </h1>
            <p className="text-lg text-white mb-8">
              Your session has expired. Please start a new session.
            </p>
            <Link 
              href="/projects"
              className="bg-[#dcfc84] text-[#1c1c1c] px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 transition-all duration-300 inline-block"
            >
              Start New Session
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Show original Learn page (when no model is trained)
  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back to Project Link */}
          <div className="mb-6">
            <Link
              href={`/projects/${urlUserId}/${urlProjectId}`}
              className="px-4 py-4 text-white/70 hover:text-white hover:bg-[#bc6cd3]/10 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to project
            </Link>
          </div>

          {/* Main Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              <span className="text-white">Machine learning </span>
              <span className="text-[#dcfc84]">models</span>
            </h1>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Box: What have you done? */}
            <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-left">
                What have you done?
              </h2>
              <div className="text-white space-y-4">
                <p className="text-base leading-relaxed">
                  You have collected examples of text for a computer to use to recognise different types of text.
                </p>
                <p className="text-base font-medium">You&apos;ve collected:</p>
                {trainingStats.labelBreakdown.length > 0 ? (
                  <ul className="space-y-2">
                    {trainingStats.labelBreakdown.map((label, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#dcfc84] rounded-full"></span>
                        <span>{label.count} examples of {label.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/50 italic">No examples collected yet</p>
                )}
                <div className="pt-4 border-t border-[#bc6cd3]/20">
                  <p className="text-sm text-white/70">
                    <strong>Total:</strong> {trainingStats.totalExamples} examples across {trainingStats.totalLabels} labels
                  </p>
                </div>
              </div>
            </div>

            {/* Right Box: What's next? */}
            <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-left">
                What&apos;s next?
              </h2>
              <div className="text-white space-y-4">
                <p className="text-base font-medium">
                  Ready to start the computer&apos;s training?
                </p>
                <p className="text-base leading-relaxed">
                  Click the button below to start training a machine learning model using the examples you have collected so far
                </p>
                <p className="text-sm text-white/70">
                  (Or go back to the{' '}
                  <button
                    onClick={handleGoToTrain}
                    className="text-[#dcfc84] hover:text-[#dcfc84]/80 underline font-medium"
                  >
                    Train
                  </button>
                  {' '}page if you want to collect some more examples first.)
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section: Info from training computer */}
          <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-xl p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-6 text-left">
              Info from training computer:
            </h3>
            
            {/* Loading State */}
            {isLoading && (
              <div className="text-center mb-6">
                <div className="w-16 h-16 border-4 border-[#bc6cd3]/20 border-t-[#dcfc84] rounded-full animate-spin mx-auto mb-4"></div>
                <h4 className="text-xl font-bold text-white mb-2">Loading...</h4>
                <p className="text-white/70 mb-4">Please wait while we load your project data...</p>
              </div>
            )}

            {/* Training in Progress */}
            {isTraining && (
              <div className="text-center mb-6">
                <div className="w-16 h-16 border-4 border-[#bc6cd3]/20 border-t-[#dcfc84] rounded-full animate-spin mx-auto mb-4"></div>
                <h4 className="text-xl font-bold text-white mb-2">Training in Progress</h4>
                <p className="text-white/70 mb-4">Your machine learning model is being trained...</p>
                <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-4 max-w-md mx-auto">
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-white/70">Status:</span>
                      <span className="text-[#dcfc84] font-medium">
                        {currentTrainingJob?.status === 'running' ? 'Training' : 
                         currentTrainingJob?.status === 'pending' ? 'Starting...' : 'Training'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Progress:</span>
                      <span className="text-[#dcfc84] font-medium">
                        {currentTrainingJob?.progress ? `${currentTrainingJob.progress}%` : 'Processing examples...'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Job ID:</span>
                      <span className="text-[#dcfc84] font-medium text-xs">
                        {currentTrainingJob?.id ? currentTrainingJob.id.substring(0, 8) + '...' : 'Starting...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trained Model Interface */}
            {trainedModel && !isTraining && (
              <div className="space-y-6">
                {/* Model Testing Section */}
                <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Try putting in some text to see how it is recognised based on your training.
                  </h4>
                  <div className="flex gap-4 items-end mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey && testText.trim() && !isTestingModel) {
                            e.preventDefault();
                            handleTestModel();
                          }
                        }}
                        placeholder="enter a test text here (Ctrl+Enter to test)"
                        className="w-full px-4 py-3 bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#dcfc84] focus:ring-1 focus:ring-[#dcfc84] transition-all duration-300"
                      />
                    </div>
                    <button
                      onClick={handleTestModel}
                      disabled={!testText.trim() || isTestingModel}
                      className="bg-[#bc6cd3] hover:bg-[#bc6cd3]/90 disabled:bg-[#1c1c1c] disabled:border disabled:border-[#bc6cd3]/20 disabled:text-white/50 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                    >
                      {isTestingModel ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Testing...
                        </div>
                      ) : (
                        'Test'
                      )}
                    </button>
                    <button
                      onClick={handleDescribeModel}
                      className="bg-[#1c1c1c] border border-[#bc6cd3]/20 hover:bg-[#bc6cd3]/10 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                    >
                      Describe your model!
                    </button>
                  </div>

                  {/* Test Results */}
                  {testResult && (
                    <div className="mt-4">
                      <h5 className="text-md font-medium text-white mb-3">Test Result:</h5>
                      <div className="bg-[#bc6cd3]/10 p-4 rounded-lg border border-[#bc6cd3]/20">
                        <div className="mb-2">
                          <span className="text-white font-medium">&ldquo;{testResult.text}&rdquo;</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white/70">Primary:</span>
                              <span className="text-[#dcfc84] font-medium">
                            {testResult.prediction} ({testResult.confidence.toFixed(1)}%)
                              </span>
                        </div>
                        {testResult.alternatives && testResult.alternatives.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/70">Other possibilities:</span>
                            <div className="flex gap-2 flex-wrap">
                              {testResult.alternatives.map((alt, altIndex) => (
                                <span key={altIndex} className="text-xs bg-[#1c1c1c] border border-[#bc6cd3]/20 text-white/80 px-2 py-1 rounded">
                                  {alt.label} ({alt.confidence.toFixed(1)}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Training Results */}
                {currentTrainingJob && currentTrainingJob.result && (
                  <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Training Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/70">Accuracy:</span>
                          <span className="text-[#dcfc84] font-medium">{currentTrainingJob.result.accuracy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Training Examples:</span>
                          <span className="text-white font-medium">{currentTrainingJob.result.training_examples}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Validation Examples:</span>
                          <span className="text-white font-medium">{currentTrainingJob.result.validation_examples}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Total Features:</span>
                          <span className="text-white font-medium">{currentTrainingJob.result.total_features}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/70">Labels:</span>
                          <span className="text-white font-medium">{currentTrainingJob.result.labels.join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Job ID:</span>
                          <span className="text-white font-medium text-xs">{currentTrainingJob.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Feature Importance */}
                    {currentTrainingJob.result.feature_importance && Object.keys(currentTrainingJob.result.feature_importance).length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-md font-medium text-white mb-3">Important Features by Label:</h5>
                        <div className="space-y-3">
                          {Object.entries(currentTrainingJob.result.feature_importance).map(([label, features]) => (
                            <div key={label}>
                              <h6 className="text-sm font-medium text-[#dcfc84] mb-1">{label}:</h6>
                              <div className="flex flex-wrap gap-1">
                                {features.slice(0, 5).map((feature, index) => (
                                  <span key={index} className="inline-block bg-[#bc6cd3]/15 text-white text-xs px-2 py-1 rounded-full">
                                    {feature}
                                  </span>
                                ))}
                                {features.length > 5 && (
                                  <span className="inline-block text-white/50 text-xs px-2 py-1">
                                    +{features.length - 5} more
                                  </span>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Model Information */}
                <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-white/70">Model started training at:</span>
                      <span className="text-white font-medium">
                        {trainedModel.startedAt.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Current model status:</span>
                      <span className="text-[#dcfc84] font-medium">{trainedModel.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Model will automatically be deleted after:</span>
                      <span className="text-white font-medium">
                        {trainedModel.expiresAt.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleDeleteModel}
                      disabled={isDeletingModel}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2"
                    >
                      {isDeletingModel ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Deleting...
                        </>
                      ) : (
                        'Delete this model'
                      )}
                    </button>
                    <button
                      onClick={handleTrainNewModel}
                      className="bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                    >
                      Train new machine learning model
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Default Training Interface */}
            {!isTraining && !trainedModel && (
              <div className="flex flex-col items-center space-y-4">
                {!canTrainModel && (
                  <div className="text-center p-4 bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg max-w-md">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#dcfc84] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h4 className="text-[#dcfc84] font-medium mb-2">⚠ Requirements not met</h4>
                        <p className="text-white text-sm">
                          You need at least <strong>6 examples</strong> and <strong>2 labels</strong> to train a model.
                          <br />
                          Current: {trainingStats.totalExamples} examples, {trainingStats.totalLabels} labels
                        </p>
                        <button
                          onClick={handleGoToTrain}
                          className="mt-3 bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                        >
                          Go to Train Page
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Debug Info */}
                <div className="text-center p-4 bg-[#2a2a2a] border border-[#bc6cd3]/20 rounded-lg max-w-md">
                  <h4 className="text-[#dcfc84] font-medium mb-2">🔍 Debug Info</h4>
                  <p className="text-white text-sm">
                    Session ID: {actualSessionId ? `${actualSessionId.substring(0, 8)}...` : 'Not set'}<br />
                    Project ID: {actualProjectId ? `${actualProjectId.substring(0, 8)}...` : 'Not set'}<br />
                    Examples: {trainingStats.totalExamples}<br />
                    Labels: {trainingStats.totalLabels}<br />
                    Can Train: {canTrainModel ? '✅ Yes' : '❌ No'}
                  </p>
                  <button
                    onClick={testTrainingAPI}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    🧪 Test Training API
                  </button>
                </div>
                
                <button
                  onClick={handleTrainModel}
                  disabled={!canTrainModel}
                  className={`px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 shadow-lg ${
                    canTrainModel
                      ? 'bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] hover:scale-105'
                      : 'bg-[#1c1c1c] border border-[#bc6cd3]/20 text-white/50 cursor-not-allowed'
                  }`}
                >
                  {canTrainModel ? (
                    <>
                      🚀 Train new machine learning model
                      <br />
                      <span className="text-sm opacity-75">
                        ({trainingStats.totalExamples} examples, {trainingStats.totalLabels} labels)
                      </span>
                    </>
                  ) : (
                    <>
                      Train new machine learning model
                      <br />
                      <span className="text-sm opacity-75">
                        Need 6+ examples and 2+ labels
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

