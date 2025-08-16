'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function LearnPage() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [trainingStats, setTrainingStats] = useState({
    totalExamples: 0,
    totalLabels: 0,
    labelBreakdown: [] as { name: string; count: number }[]
  });

  const params = useParams();
  const router = useRouter();
  const urlUserId = params?.userid as string;
  const projectId = params?.projectid as string;

  useEffect(() => {
    validateUserSession();
  }, [urlUserId, projectId]);

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
    } catch (error) {
      console.error('Error loading project and training data:', error);
    }
  };

  const handleLanguageChange = (language: string) => {
    console.log('Language changed to:', language);
  };

  const handleLoginClick = () => {
    console.log('Login clicked');
  };

  const handleBackToProject = () => {
    router.push(`/projects/${urlUserId}/${projectId}`);
  };

  const handleTrainModel = () => {
    // Navigate to training page or start training process
    console.log('Starting training process...');
    // You can implement the actual training logic here
  };

  const handleGoToTrain = () => {
    router.push(`/projects/${urlUserId}/${projectId}/train`);
  };

  // Check if training requirements are met
  const canTrainModel = trainingStats.totalExamples >= 6 && trainingStats.totalLabels >= 2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header 
          onLanguageChange={handleLanguageChange}
          onLoginClick={handleLoginClick}
        />
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
        <Header 
          onLanguageChange={handleLanguageChange}
          onLoginClick={handleLoginClick}
        />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Session Expired
            </h1>
            <p className="text-lg text-white mb-8">
              Your session has expired. Please start a new session.
            </p>
            <a 
              href="/projects"
              className="bg-[#dcfc84] text-[#1c1c1c] px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 transition-all duration-300 inline-block"
            >
              Start New Session
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      <Header 
        onLanguageChange={handleLanguageChange}
        onLoginClick={handleLoginClick}
      />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back to Project Link */}
          <div className="mb-6">
            <a
              href={`/projects/${urlUserId}/${projectId}`}
              className="p-2 text-white/70 hover:text-white hover:bg-[#bc6cd3]/10 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to project
            </a>
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
                <p className="text-base font-medium">You've collected:</p>
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
                What's next?
              </h2>
              <div className="text-white space-y-4">
                <p className="text-base font-medium">
                  Ready to start the computer's training?
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
            <div className="flex flex-col items-center space-y-4">
              {!canTrainModel && (
                <div className="text-center p-4 bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg max-w-md">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#dcfc84] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-[#dcfc84] font-medium mb-2">⚠️ Requirements not met</h4>
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
          </div>
        </div>
      </main>
    </div>
  );
}
