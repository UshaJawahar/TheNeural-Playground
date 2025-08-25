'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import { SCRATCH_EDITOR_URL } from '@/config/scratch-editor';

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



export default function MakePage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [actualSessionId, setActualSessionId] = useState<string>('');
  const [actualProjectId, setActualProjectId] = useState<string>('');
  const [showScratchInfo, setShowScratchInfo] = useState(false);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  const [projectDataLoaded, setProjectDataLoaded] = useState(false);
  const [projectLabels, setProjectLabels] = useState<string[]>([]);

  const params = useParams();
  const urlUserId = params?.userid as string;
  const urlProjectId = params?.projectid as string;

  useEffect(() => {
    validateGuestSession();
  }, [urlUserId, urlProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Monitor URL changes and update localStorage if project changes
  useEffect(() => {
    if (actualProjectId && actualSessionId && selectedProject) {
      // Check if the current URL project ID matches the actual project ID
      const currentUrl = window.location.href;
      const urlParts = currentUrl.split('/');
      const currentProjectIdInUrl = urlParts[urlParts.length - 2];
      
      if (currentProjectIdInUrl !== actualProjectId) {
        console.log('URL project ID mismatch detected:', {
          urlProjectId: currentProjectIdInUrl,
          actualProjectId: actualProjectId
        });
        
        // Clear old project data first
        const keysToClear = [
          'ml_extension_project_id',
          'ml_extension_session_id', 
          'ml_extension_project_name',
          'ml_extension_project_labels'
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
        
        // Update localStorage to reflect the actual project being viewed
        localStorage.setItem('ml_extension_project_id', actualProjectId);
        localStorage.setItem('ml_extension_session_id', actualSessionId);
        localStorage.setItem('ml_extension_project_name', selectedProject.name);
        
        console.log('LocalStorage updated to reflect actual project:', {
          projectId: actualProjectId,
          sessionId: actualSessionId,
          projectName: selectedProject.name,
          oldDataCleared: true
        });
        
        // Update the URL to match the actual project ID
        const newUrl = currentUrl.replace(`/${currentProjectIdInUrl}/`, `/${actualProjectId}/`);
        window.history.replaceState({}, '', newUrl);
        console.log('URL updated to match actual project:', newUrl);
      }
    }
  }, [actualProjectId, actualSessionId, selectedProject, urlProjectId]);

  // Cleanup function to remove project-specific data when component unmounts
  useEffect(() => {
    return () => {
      // Only clear if we're navigating away from this project
      if (actualProjectId && actualSessionId) {
        console.log('Component unmounting, clearing project-specific localStorage data');
        const keysToClear = [
          'ml_extension_project_id',
          'ml_extension_session_id', 
          'ml_extension_project_name',
          'ml_extension_project_labels'
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
      }
    };
  }, [actualProjectId, actualSessionId]);

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
        window.location.href = `/projects/${maskedId}/${urlProjectId}/make`;
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
            setIsValidSession(true);
            
            // Load project after setting session as valid
            await loadProject(sessionId, projectId);
          } else {
            console.error('Session expired');
            await cleanupSessionWithReason(SessionCleanupReason.EXPIRED_BACKEND);
            window.location.href = '/projects';
            return;
          }
        } else {
          console.error('Session inactive');
          localStorage.removeItem('neural_playground_session_id');
          localStorage.removeItem('neural_playground_session_created');
          window.location.href = '/projects';
          return;
        }
      } else {
        console.error('Session validation failed:', response.status);
        await cleanupSessionWithReason(SessionCleanupReason.ERROR_FALLBACK);
        window.location.href = '/projects';
        return;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      localStorage.removeItem('neural_playground_session_id');
      localStorage.removeItem('neural_playground_session_created');
      window.location.href = '/projects';
      return;
    }
    setIsLoading(false);
  };

  const loadProject = async (sessionId: string, projectId: string) => {
    try {
      console.log('Loading project:', projectId, 'for session:', sessionId);
      
      // Load all projects for the session and find the specific project
      const response = await fetch(`${config.apiBaseUrl}/api/guests/session/${sessionId}/projects`);
      
      if (response.ok) {
        const projectsResponse = await response.json();
        console.log('Projects response:', projectsResponse);
        
        if (projectsResponse.success && projectsResponse.data) {
          console.log('Available projects:', projectsResponse.data.map((p: Project) => ({ id: p.id, name: p.name })));
          
          // Find the specific project by ID
          const project = projectsResponse.data.find((p: Project) => p.id === projectId);
          
          if (project) {
            console.log('Found project:', project);
            setSelectedProject(project);
            
            // Update localStorage with the current project information
            localStorage.setItem('ml_extension_project_id', projectId);
            localStorage.setItem('ml_extension_session_id', sessionId);
            localStorage.setItem('ml_extension_project_name', project.name);
            
            console.log('Project loaded and stored in localStorage:', {
              projectId: projectId,
              sessionId: sessionId,
              projectName: project.name
            });
          } else {
            // Project not found in the session's projects
            console.error('Project not found in session projects. Looking for:', projectId);
            console.error('Available project IDs:', projectsResponse.data.map((p: Project) => p.id));
            window.location.href = `/projects/${urlUserId}`;
            return;
          }
        } else {
          // No projects found or empty response
          console.error('No projects found for session or invalid response structure');
          window.location.href = `/projects/${urlUserId}`;
          return;
        }
      } else {
        // Failed to load projects
        console.error('Failed to load session projects:', response.status);
        window.location.href = `/projects/${urlUserId}`;
        return;
      }
    } catch (error) {
      console.error('Error loading session projects:', error);
      window.location.href = `/projects/${urlUserId}`;
      return;
    }
  };

  // New function to load detailed project data including labels
  const loadProjectDetails = async () => {
    if (!actualSessionId || !actualProjectId) {
      console.error('Cannot load project details: missing session or project ID');
      return;
    }

    setIsLoadingProjectData(true);
    try {
      console.log('Loading detailed project data...');
      
      const response = await fetch(`${config.apiBaseUrl}/api/guests/session/${actualSessionId}/projects/${actualProjectId}`);
      
      if (response.ok) {
        const projectResponse = await response.json();
        console.log('Project details response:', projectResponse);
        
        if (projectResponse.success && projectResponse.data) {
          const details = projectResponse.data;
          
          // Extract labels from the model
          if (details.model && Array.isArray(details.model.labels)) {
            const labels = details.model.labels;
            setProjectLabels(labels);
            
            // Store labels in localStorage for the ML extension
            localStorage.setItem('ml_extension_project_labels', JSON.stringify(labels));
            
            console.log('Project labels loaded:', labels);
            console.log('Labels stored in localStorage for ML extension');
          } else {
            console.warn('No labels found in project model');
            setProjectLabels([]);
            localStorage.setItem('ml_extension_project_labels', '[]');
          }
          
          // Mark project data as loaded
          setProjectDataLoaded(true);
          
          console.log('Project details loaded successfully:', {
            name: details.name,
            labels: projectLabels,
            dataLoaded: true
          });
        } else {
          console.error('Failed to load project details:', projectResponse);
        }
      } else {
        console.error('Failed to fetch project details:', response.status);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    } finally {
      setIsLoadingProjectData(false);
    }
  };

  const handleScratchClick = async () => {
    // Load project details first
    await loadProjectDetails();
    
    // Show the Scratch info page
    setShowScratchInfo(true);
  };

  const handleOpenInScratch = () => {
    // Ensure localStorage has the current project information
    localStorage.setItem('ml_extension_project_id', actualProjectId);
    localStorage.setItem('ml_extension_session_id', actualSessionId);
    localStorage.setItem('ml_extension_project_name', selectedProject?.name || 'Unknown Project');
    
    // Ensure labels are stored
    if (projectLabels.length > 0) {
      localStorage.setItem('ml_extension_project_labels', JSON.stringify(projectLabels));
    }
    
    // Update the URL to reflect the current project (in case it was different)
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split('/');
    const currentProjectIdInUrl = urlParts[urlParts.length - 2]; // Get project ID from URL
    
    // If the URL project ID is different from the actual project ID, update it
    if (currentProjectIdInUrl !== actualProjectId) {
      const newUrl = currentUrl.replace(`/${currentProjectIdInUrl}/`, `/${actualProjectId}/`);
      window.history.replaceState({}, '', newUrl);
      console.log('URL updated to reflect current project:', newUrl);
    }
    
    // Clear any old project data from localStorage to ensure fresh start
    const keysToClear = [
      'ml_extension_project_id',
      'ml_extension_session_id', 
      'ml_extension_project_name',
      'ml_extension_project_labels'
    ];
    
    // Clear old data first
    keysToClear.forEach(key => localStorage.removeItem(key));
    
    // Set fresh data
    localStorage.setItem('ml_extension_project_id', actualProjectId);
    localStorage.setItem('ml_extension_session_id', actualSessionId);
    localStorage.setItem('ml_extension_project_name', selectedProject?.name || 'Unknown Project');
    
    if (projectLabels.length > 0) {
      localStorage.setItem('ml_extension_project_labels', JSON.stringify(projectLabels));
    }
    
    // Open the Scratch GUI running on port 8601 with session and project parameters
    const scratchGuiUrl = `${SCRATCH_EDITOR_URL}/?sessionId=${actualSessionId}&projectId=${actualProjectId}`;
    window.open(scratchGuiUrl, '_blank');
    
    console.log('Scratch opened with fresh project data:', {
      sessionId: actualSessionId,
      projectId: actualProjectId,
      projectName: selectedProject?.name,
      labels: projectLabels,
      storedInLocalStorage: true,
      localStorageKeys: {
        projectId: 'ml_extension_project_id',
        sessionId: 'ml_extension_session_id',
        projectName: 'ml_extension_project_name',
        labels: 'ml_extension_project_labels'
      },
      oldDataCleared: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!isValidSession || !selectedProject) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Invalid Session or Project
            </h1>
            <p className="text-lg text-white mb-8">
              Please return to your projects and try again.
            </p>
            <a 
              href={`/projects/${urlUserId}`}
              className="bg-[#dcfc84] text-[#1c1c1c] px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 transition-all duration-300 inline-block"
            >
              Back to Projects
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back to Project Navigation */}
          <div className="flex items-center mb-8">
            <a
              href={`/projects/${urlUserId}/${urlProjectId}`}
              className="p-2 text-white/70 hover:text-white hover:bg-[#bc6cd3]/10 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to project
            </a>
          </div>

          {!showScratchInfo ? (
            <>
              {/* Main Heading */}
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Make something with your machine learning model
                </h1>
              </div>

              {/* Integration Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Scratch 3 Card */}
                <div className="bg-[#1c1c1c] border-2 border-[#bc6cd3]/20 rounded-lg p-6 shadow-lg">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-3">Scratch 3</h2>
                    <p className="text-[#dcfc84] text-sm mb-4">
                      Use your machine learning model in Scratch
                    </p>
                    
                    {/* Action Button */}
                    <button 
                      onClick={handleScratchClick}
                      className="bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300"
                    >
                      Open Scratch Editor
                    </button>
                    
                    {/* Scratch Image */}
                    <div className="mt-4">
                      <img src="/image.png" alt="Scratch Integration" className="w-full h-auto rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Scratch Info Page Header */}
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Custom Machine Learning Blocks for Scratch
                </h1>
                <button
                  onClick={() => setShowScratchInfo(false)}
                  className="bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] px-6 py-3 rounded-lg font-medium transition-all duration-300"
                >
                  Back to Options
                </button>
              </div>

              {/* Loading State */}
              {isLoadingProjectData && (
                <div className="text-center mb-8">
                  <div className="bg-[#2a2a2a] border border-[#bc6cd3]/20 rounded-lg p-6">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#dcfc84]"></div>
                      <span className="text-white">Loading project data...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Open in Scratch Button - Only enabled when data is loaded */}
              <div className="text-center mb-12">
                <button
                  onClick={handleOpenInScratch}
                  disabled={!projectDataLoaded || isLoadingProjectData}
                  className={`px-8 py-4 rounded-lg font-medium text-xl transition-all duration-300 ${
                    projectDataLoaded && !isLoadingProjectData
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isLoadingProjectData ? 'Loading...' : 'Open in Scratch 3.0'}
                </button>
                
                {!projectDataLoaded && !isLoadingProjectData && (
                  <p className="text-sm text-gray-400 mt-2">
                    Click &ldquo;Open Scratch Editor&rdquo; first to load project data
                  </p>
                )}
              </div>

              {/* Project Data Summary */}
              {projectDataLoaded && (
                <div className="bg-[#2a2a2a] border border-[#bc6cd3]/20 rounded-lg p-6 mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Project Data Loaded</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-300 mb-2">Project Name:</p>
                      <p className="text-white font-mono">{selectedProject?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-300 mb-2">Labels Found:</p>
                      <p className="text-white font-mono">
                        {projectLabels.length > 0 ? projectLabels.join(', ') : 'No labels found'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-green-400 mt-3">
                    ✅ Project data is ready for Scratch. You can now open Scratch 3.0!
                  </p>
                </div>
              )}

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Section - Explanation of Custom Blocks */}
                <div className="bg-[#2a2a2a] border border-[#bc6cd3]/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Your project will add these blocks to Scratch</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-800 text-white p-3 rounded-lg">
                      <p className="font-mono text-sm">ML recognise text text (label)</p>
                      <p className="text-blue-100 text-xs mt-1">Takes text input and returns the label that the machine learning model recognizes it as.</p>
                    </div>
                    
                    <div className="bg-blue-800 text-white p-3 rounded-lg">
                      <p className="font-mono text-sm">ML recognise text text (confidence)</p>
                      <p className="text-blue-100 text-xs mt-1">Returns a number from 0-100, indicating how confident the machine learning model is in recognizing the type of text.</p>
                    </div>
                    
                    {/* Dynamic Labels */}
                    {projectLabels.length > 0 ? (
                      projectLabels.map((label, index) => (
                        <div key={index} className="bg-blue-800 text-white p-3 rounded-lg">
                          <p className="font-mono text-sm">ML {label}</p>
                          <p className="text-blue-100 text-xs mt-1">Represents the &ldquo;{label}&rdquo; label from your project.</p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-blue-800 text-white p-3 rounded-lg">
                        <p className="font-mono text-sm">ML label</p>
                        <p className="text-blue-100 text-xs mt-1">Represents the labels created in your project, which can be used by your scripts.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section - Scratch Editor Preview */}
                <div className="bg-[#2a2a2a] border border-[#bc6cd3]/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    It will look something like this - with your project name: {selectedProject?.name}
                  </h3>
                  
                  <div className="bg-white border rounded-lg p-4">
                    {/* Scratch Editor Header */}
                    <div className="flex items-center gap-4 mb-4 pb-2 border-b">
                      <span className="font-bold text-blue-600">SCRATCH</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">🌐</span>
                        <span className="text-gray-600">File</span>
                        <span className="text-gray-600">Edit</span>
                        <span className="text-gray-600">Project templates</span>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-t-lg text-sm">Code</span>
                      <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-t-lg text-sm">Costumes</span>
                      <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-t-lg text-sm">Sounds</span>
                    </div>

                    {/* Block Palette */}
                    <div className="flex gap-4">
                      <div className="w-48 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">{selectedProject?.name || "my project"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Operators</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Variables</span>
                        </div>
                        <div className="text-sm text-gray-600">My Blocks</div>
                        <div className="text-sm text-gray-600">Images</div>
                      </div>

                      {/* Custom Blocks */}
                      <div className="flex-1 space-y-2">
                        <div className="bg-blue-800 text-white p-2 rounded text-sm font-mono">ML recognise text text (label)</div>
                        <div className="bg-blue-800 text-white p-2 rounded text-sm font-mono">ML recognise text text (confidence)</div>
                        
                        {/* Dynamic Labels */}
                        {projectLabels.length > 0 ? (
                          projectLabels.map((label, index) => (
                            <div key={index} className="bg-blue-800 text-white p-2 rounded text-sm font-mono">
                              ML {label}
                            </div>
                          ))
                        ) : (
                          <div className="bg-blue-800 text-white p-2 rounded text-sm font-mono">ML label</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}