'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../../components/Header';

interface UserSession {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface Project {
  id: string;
  name: string;
  type: string;
  createdAt: string;
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

export default function LearnPage() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setProject] = useState<Project | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [trainingStats, setTrainingStats] = useState({
    totalExamples: 0,
    totalLabels: 0,
    labelBreakdown: [] as { name: string; count: number }[]
  });
  const [isTraining, setIsTraining] = useState(false);
  const [trainedModel, setTrainedModel] = useState<TrainedModel | null>(null);
  const [testText, setTestText] = useState('');
  const [testResults, setTestResults] = useState<Array<{
    text: string;
    prediction: string;
    confidence: number;
  }>>([]);

  const params = useParams();
  const router = useRouter();
  const urlUserId = params?.userid as string;
  const projectId = params?.projectid as string;

  useEffect(() => {
    validateUserSession();
  }, [urlUserId, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateUserSession = () => {
    if (!urlUserId || !projectId) {
      setIsLoading(false);
      return;
    }

    try {
      const sessionData = localStorage.getItem('neural_playground_session');
      if (sessionData) {
        const session: UserSession = JSON.parse(sessionData);
        const now = Date.now();
        
        if (now < session.expiresAt && session.userId === urlUserId) {
          setUserSession(session);
          setIsValidSession(true);
          loadProjectAndTrainingData(session.userId, projectId);
        } else if (session.userId !== urlUserId) {
          window.location.href = `/projects/${session.userId}`;
          return;
        } else {
          localStorage.removeItem('neural_playground_session');
          window.location.href = '/projects';
          return;
        }
      } else {
        window.location.href = '/projects';
        return;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      localStorage.removeItem('neural_playground_session');
      window.location.href = '/projects';
      return;
    }
    setIsLoading(false);
  };

  const loadProjectAndTrainingData = (userId: string, projectId: string) => {
    try {
      // Load project data
      const projectsKey = `neural_playground_projects_${userId}`;
      const savedProjects = localStorage.getItem(projectsKey);
      if (savedProjects) {
        const projects: Project[] = JSON.parse(savedProjects);
        const foundProject = projects.find(p => p.id === projectId);
        if (foundProject) {
          setProject(foundProject);
        }
      }

      // Load training labels and examples
      const labelsKey = `neural_playground_labels_${userId}_${projectId}`;
      const savedLabels = localStorage.getItem(labelsKey);
      if (savedLabels) {
        const labelsData: Label[] = JSON.parse(savedLabels);
        setLabels(labelsData);
        
        // Calculate training statistics
        const totalExamples = labelsData.reduce((sum, label) => sum + label.examples.length, 0);
        const totalLabels = labelsData.length;
        const labelBreakdown = labelsData.map(label => ({
          name: label.name,
          count: label.examples.length
        }));

        setTrainingStats({
          totalExamples,
          totalLabels,
          labelBreakdown
        });
      }

      // Load trained model if exists
      const modelKey = `neural_playground_model_${userId}_${projectId}`;
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
    }
  };



  const handleTrainModel = async () => {
    if (!canTrainModel) return;
    
    setIsTraining(true);
    
    // Simulate training process for 3 seconds
    setTimeout(() => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
      
      const newModel: TrainedModel = {
        id: `model-${Date.now()}`,
        status: 'available',
        startedAt: now,
        expiresAt: expiresAt
      };
      
      setTrainedModel(newModel);
      setIsTraining(false);
      
      // Save model to localStorage
      if (userSession) {
        const modelKey = `neural_playground_model_${userSession.userId}_${projectId}`;
        localStorage.setItem(modelKey, JSON.stringify(newModel));
      }
    }, 3000);
  };

  const handleGoToTrain = () => {
    router.push(`/projects/${urlUserId}/${projectId}/train`);
  };

  const handleDeleteModel = () => {
    if (userSession) {
      const modelKey = `neural_playground_model_${userSession.userId}_${projectId}`;
      localStorage.removeItem(modelKey);
      setTrainedModel(null);
      setTestResults([]);
    }
  };

  const handleTrainNewModel = () => {
    setTrainedModel(null);
    setTestResults([]);
  };

  const handleTestModel = () => {
    if (!testText.trim() || !trainedModel) return;
    
    // Simulate model prediction
    const predictions = labels.map(label => ({
      label: label.name,
      confidence: Math.random() * 0.4 + 0.6 // Random confidence between 0.6 and 1.0
    }));
    
    // Sort by confidence and get the best prediction
    predictions.sort((a, b) => b.confidence - a.confidence);
    const bestPrediction = predictions[0];
    
    const newResult = {
      text: testText,
      prediction: bestPrediction.label,
      confidence: bestPrediction.confidence
    };
    
    setTestResults(prev => [newResult, ...prev]);
    setTestText('');
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
              href={`/projects/${urlUserId}/${projectId}`}
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
                  You have collected examples of text for a computer to use to recognise when text is happy or sad.
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
                      <span className="text-[#dcfc84] font-medium">Training</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Progress:</span>
                      <span className="text-[#dcfc84] font-medium">Processing examples...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Time remaining:</span>
                      <span className="text-[#dcfc84] font-medium">~3 seconds</span>
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
                        placeholder="enter a test text here"
                        className="w-full px-4 py-3 bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#dcfc84] focus:ring-1 focus:ring-[#dcfc84] transition-all duration-300"
                      />
                    </div>
                    <button
                      onClick={handleTestModel}
                      disabled={!testText.trim()}
                      className="bg-[#bc6cd3] hover:bg-[#bc6cd3]/90 disabled:bg-[#1c1c1c] disabled:border disabled:border-[#bc6cd3]/20 disabled:text-white/50 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                    >
                      Test
                    </button>
                    <button
                      onClick={handleDescribeModel}
                      className="bg-[#1c1c1c] border border-[#bc6cd3]/20 hover:bg-[#bc6cd3]/10 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                    >
                      Describe your model!
                    </button>
                  </div>

                  {/* Test Results */}
                  {testResults.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-md font-medium text-white mb-3">Test Results:</h5>
                      <div className="space-y-2">
                        {testResults.map((result, index) => (
                          <div key={index} className="bg-[#bc6cd3]/10 p-3 rounded-lg border border-[#bc6cd3]/20">
                            <div className="flex justify-between items-center">
                              <span className="text-white">&ldquo;{result.text}&rdquo;</span>
                              <span className="text-[#dcfc84] font-medium">
                                Predicted as: {result.prediction} ({(result.confidence * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

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
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                    >
                      Delete this model
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
                <button
                  onClick={handleTrainModel}
                  disabled={!canTrainModel}
                  className={`px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 shadow-lg ${
                    canTrainModel
                      ? 'bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] hover:scale-105'
                      : 'bg-[#1c1c1c] border border-[#bc6cd3]/20 text-white/50 cursor-not-allowed'
                  }`}
                >
                  Train new machine learning model
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
