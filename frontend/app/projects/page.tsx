'use client';

import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectCreator, { Project } from '@/components/ProjectCreator';
import TextRecognition from '@/components/TextRecognition';
import { apiService } from '@/lib/api';

// Custom hook to safely handle localStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.log('Error getting localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      if (typeof window !== 'undefined') {
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.log('Error setting localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}

function ProjectsPageContent() {
  console.log('ProjectsPageContent component rendering');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<'list' | 'project'>('list');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());
  const [isClearingAll, setIsClearingAll] = useState(false);
  
  // State to track if component is mounted
  const [isMounted, setIsMounted] = useState(false);
  
  // Ref to track refresh timeout
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch projects from API - memoized to prevent unnecessary re-creation
  const fetchProjects = useCallback(async () => {
    // Don't fetch if component is not mounted or if already loading
    if (!isMounted || isLoading) return;
    
    console.log('fetchProjects called, isMounted:', isMounted, 'isLoading:', isLoading);
    
    try {
      setIsLoading(true);
      console.log('Making API call to getProjects...');
      const response = await apiService.getProjects();
      console.log('API response received:', response);
      
      if (response.success && response.data) {
        console.log('Processing projects data:', response.data);
        // Convert API response to frontend Project format
        const apiProjects = response.data.map((apiProject: any) => ({
          id: apiProject.id,
          name: apiProject.name,
          type: apiProject.type as 'text-recognition',
          datasets: [], // Keep for backward compatibility
          dataset: apiProject.dataset || { examples: [], labels: [], records: 0 },
          model: apiProject.model || null,
          createdAt: apiProject.createdAt,
          updatedAt: apiProject.updatedAt,
          status: apiProject.status as 'draft' | 'training' | 'trained' | 'testing',
          hasBeenTested: false, // Default value
          hasOpenedScratch: false // Default value
        }));
        
        console.log('Converted projects:', apiProjects);
        setProjects(apiProjects);
        setError(null);
      } else {
        console.log('Response not successful or no data:', response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      console.error('Error in fetchProjects:', error);
      setError(errorMessage);
      console.error('Error fetching projects:', error);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  }, [isMounted, isLoading]); // Add isLoading as dependency
  
  // Debounced refresh function to prevent rapid successive calls
  const debouncedRefresh = useCallback(() => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Set new timeout for refresh
    refreshTimeoutRef.current = setTimeout(() => {
      fetchProjects();
    }, 300); // 300ms delay
  }, [fetchProjects]);

  // Initial fetch only - no automatic refreshes
  useEffect(() => {
    console.log('Initial fetch useEffect triggered, isMounted:', isMounted);
    // Only fetch if component is mounted
    if (isMounted) {
      console.log('Calling fetchProjects for initial fetch');
      fetchProjects();
    }
  }, [isMounted, fetchProjects]); // Depend on isMounted and fetchProjects
  
  // Handle component mount/unmount
  useEffect(() => {
    console.log('Component mount effect triggered');
    setIsMounted(true);
    
    return () => {
      console.log('Component unmount effect triggered');
      setIsMounted(false);
      // Clear any pending refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Check if there's a project ID in URL - only when projects are loaded
  useEffect(() => {
    const projectId = searchParams.get('id');
    if (projectId && projects.length > 0) {
      const project = projects.find((p: Project) => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setView('project');
      }
    }
  }, [searchParams, projects.length]); // Only depend on projects.length, not the entire projects array

  const createProject = useCallback((project: Project) => {
    // Add the new project to the list
    setProjects(prevProjects => [...prevProjects, project]);
    setSelectedProject(project);
    setView('project');
    
    // Update URL without navigation
    const newUrl = `/projects?id=${project.id}`;
    window.history.pushState({}, '', newUrl);
    
    // Clear any previous errors and show success message
    setError(null);
    setSuccess(`Project "${project.name}" created successfully!`);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 5000);
  }, []);

  const handleProjectError = useCallback((errorMessage: string) => {
    setError(`Project creation failed: ${errorMessage}`);
  }, []);

  const selectProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setView('project');
    
    // Update URL without navigation
    const newUrl = `/projects?id=${project.id}`;
    window.history.pushState({}, '', newUrl);
  }, []);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setSelectedProject(updatedProject);
    
    // Update projects list with the updated project
    setProjects(prevProjects => prevProjects.map((p: Project) => 
      p.id === updatedProject.id ? updatedProject : p
    ));
  }, []);

  const deleteProject = useCallback(async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      try {
        // Set loading state for this specific project
        setDeletingProjects(prev => new Set(prev).add(projectId));
        
        await apiService.deleteProject(projectId);
        
        // Remove the project from the local state
        setProjects(prevProjects => prevProjects.filter((p: Project) => p.id !== projectId));
        
        // If the deleted project was selected, clear the selection
        setSelectedProject(prevSelected => {
          if (prevSelected && prevSelected.id === projectId) {
            return null;
          }
          return prevSelected;
        });
        
        if (selectedProject && selectedProject.id === projectId) {
          setView('list');
          window.history.pushState({}, '', '/projects');
        }
        
        setSuccess(`Project "${projectName}" deleted successfully!`);
        setError(null);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
        setError(errorMessage);
        console.error('Error deleting project:', error);
      } finally {
        // Clear loading state for this project
        setDeletingProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      }
    }
  }, [selectedProject]);

  const deleteMultipleProjects = useCallback(async (projectIds: string[]) => {
    if (confirm(`Are you sure you want to delete ${projectIds.length} project(s)? This action cannot be undone.`)) {
      try {
        // Set loading state for clear all operation
        setIsClearingAll(true);
        
        const response = await apiService.deleteProject(projectIds);
        
        if (response.success) {
          // Remove all deleted projects from the local state
          setProjects(prevProjects => prevProjects.filter((p: Project) => !projectIds.includes(p.id)));
          
          // If any of the deleted projects were selected, clear the selection
          setSelectedProject(prevSelected => {
            if (prevSelected && projectIds.includes(prevSelected.id)) {
              return null;
            }
            return prevSelected;
          });
          
          if (selectedProject && projectIds.includes(selectedProject.id)) {
            setView('list');
            window.history.pushState({}, '', '/projects');
          }
          
          setSuccess(response.message || `Successfully deleted ${projectIds.length} project(s)!`);
          setError(null);
          
          // Clear success message after 5 seconds
          setTimeout(() => {
            setSuccess(null);
          }, 5000);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete projects';
        setError(errorMessage);
        console.error('Error deleting projects:', error);
      } finally {
        // Clear loading state
        setIsClearingAll(false);
      }
    }
  }, [selectedProject]);

  const handleBackToList = useCallback(() => {
    setSelectedProject(null);
    setView('list');
    
    // Update URL without navigation
    window.history.pushState({}, '', '/projects');
  }, []);



  // Project Work View
  if (view === 'project' && selectedProject) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full">
          {/* Project Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToList}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {selectedProject.name}
                </h1>
                <p className="text-gray-600">
                  Text Recognition Project
                </p>
              </div>
            </div>
          </div>

          {/* Project Content */}
          <div className="w-full">
            <TextRecognition 
              project={selectedProject} 
              onUpdateProject={handleUpdateProject}
            />
          </div>
        </div>
      </div>
    );
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Home</span>
            </button>
            
            {/* Clear All Button */}
            {projects.length > 0 && (
              <button
                onClick={() => {
                  const allProjectIds = projects.map(p => p.id);
                  deleteMultipleProjects(allProjectIds);
                }}
                className="text-red-600 hover:text-red-700 transition-colors flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-50"
                title="Clear all projects"
                disabled={isClearingAll}
              >
                {isClearingAll ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8 0 0015.357 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                <span>{isClearingAll ? 'Clearing...' : 'Clear All Projects'}</span>
              </button>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Playground Projects
          </h1>
          <p className="text-gray-600 text-lg">
            Create and manage your AI text recognition projects
          </p>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8">
          {/* Success Display */}
          {success && (
            <div className="mb-6 max-w-2xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-green-800">
                    <p className="font-medium">Success!</p>
                    <p className="text-sm">{success}</p>
                  </div>
                  <button
                    onClick={() => setSuccess(null)}
                    className="ml-auto text-green-400 hover:text-green-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-red-800">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={fetchProjects}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            // Centered layout when no projects exist
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No Projects Found
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  You haven't created any projects yet. Start building your AI text recognition model!
                </p>
                
                <ProjectCreator onCreateProject={createProject} onError={handleProjectError} />
              </div>
            </div>
          ) : (
            // Full-width layout when projects exist
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Project Creation */}
              <div className="lg:col-span-1">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Create New Project
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Start building your AI text recognition model
                  </p>
                </div>
                
                <ProjectCreator onCreateProject={createProject} onError={handleProjectError} />
              </div>

              {/* Projects List */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Projects ({projects.length})
                  </h2>
                  <button
                    onClick={debouncedRefresh}
                    disabled={isLoading || !isMounted}
                    className="text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!isMounted ? "Page not ready" : "Refresh projects from server"}
                  >
                    {isLoading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8 0 0015.357 2" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8 0 0015.357 2" />
                      </svg>
                    )}
                    <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                   {projects.map((project: Project) => {
                     const totalExamples = project.dataset?.records || 0;
                     const totalLabels = project.dataset?.labels?.length || 0;
                     
                     return (
                       <div
                         key={project.id}
                         className="bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer relative"
                         onClick={() => selectProject(project)}
                       >
                         {/* Delete Button */}
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             deleteProject(project.id, project.name);
                           }}
                           className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                           title={`Delete ${project.name}`}
                         >
                           {deletingProjects.has(project.id) ? (
                             <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8 0 0015.357 2" />
                             </svg>
                           ) : (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                           )}
                         </button>
                         
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                               <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                             </div>
                             <div>
                               <h3 className="text-lg font-semibold text-gray-900">
                                 {project.name}
                               </h3>
                               <p className="text-sm text-gray-600">
                                 {project.type === 'text-recognition' ? 'Text Recognition' : project.type}
                               </p>
                             </div>
                           </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4 mb-4">
                           <div className="text-center">
                             <div className="text-lg font-semibold text-gray-900">{totalLabels}</div>
                             <div className="text-xs text-gray-600">Labels</div>
                           </div>
                           <div className="text-center">
                             <div className="text-lg font-semibold text-gray-900">{totalExamples}</div>
                             <div className="text-xs text-gray-600">Examples</div>
                           </div>
                         </div>
                         
                         <div className="mt-4 pt-4 border-t border-gray-200">
                           <div className="text-sm text-gray-600">
                             Click to open and work on this project
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading projects...</p>
      </div>
    </div>}>
      <ProjectsPageContent />
    </Suspense>
  );
}
