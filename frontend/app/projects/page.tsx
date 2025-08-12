'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectCreator, { Project } from '@/components/ProjectCreator';
import TextRecognition from '@/components/TextRecognition';

// Custom hook to safely handle localStorage
const useLocalStorage = (key: string, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  const setValue = (value: any) => {
    try {
      if (typeof window !== 'undefined') {
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.log('Error setting localStorage:', error);
    }
  };

  const getValue = () => {
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
  };

  useEffect(() => {
    setStoredValue(getValue());
  }, []);

  return [storedValue, setValue] as const;
};

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useLocalStorage('ai-playground-projects', []);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<'list' | 'project'>('list');

  // Check if there's a project ID in URL
  useEffect(() => {
    const projectId = searchParams.get('id');
    if (projectId && projects.length > 0) {
      const project = projects.find((p: Project) => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setView('project');
      }
    }
  }, [searchParams, projects]);

  const createProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: projectData.name,
      type: projectData.type,
      datasets: projectData.datasets,
      model: projectData.model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    setProjects([...projects, newProject]);
    setSelectedProject(newProject);
    setView('project');
    
    // Update URL without navigation
    const newUrl = `/projects?id=${newProject.id}`;
    window.history.pushState({}, '', newUrl);
  };

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setView('project');
    
    // Update URL without navigation
    const newUrl = `/projects?id=${project.id}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setSelectedProject(updatedProject);
    
    // Update projects list with the updated project
    const updatedProjects = projects.map((p: Project) => 
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(updatedProjects);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setView('list');
    
    // Update URL without navigation
    window.history.pushState({}, '', '/projects');
  };

  const refreshProjects = () => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('ai-playground-projects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
      }
    }
  };

  // Project Work View
  if (view === 'project' && selectedProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Project Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
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
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(selectedProject.updatedAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-400">
                  Status: {selectedProject.status}
                </div>
              </div>
            </div>
          </div>

          {/* Project Content */}
          <div className="p-6">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
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
            
            {projects.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete all projects? This action cannot be undone.')) {
                    setProjects([]);
                    if (selectedProject) {
                      setSelectedProject(null);
                      setView('list');
                      window.history.pushState({}, '', '/projects');
                    }
                  }
                }}
                className="text-red-600 hover:text-red-700 transition-colors flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-50"
                title="Clear all projects"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear All Projects</span>
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
        <div className="p-6">
          {projects.length === 0 ? (
            // Centered layout when no projects exist
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
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
                
                <ProjectCreator onCreateProject={createProject} />
              </div>
            </div>
          ) : (
            // Sidebar layout when projects exist
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Project Creation */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
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
                  
                  <ProjectCreator onCreateProject={createProject} />
                </div>
              </div>

              {/* Projects List */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Your Projects ({projects.length})
                  </h2>
                  
                  <div className="grid gap-4">
                    {projects.map((project: Project, index: number) => {
                      const totalExamples = project.datasets.reduce((sum: number, dataset: any) => sum + dataset.examples.length, 0);
                      const isReady = project.datasets.length >= 2 && project.datasets.every((d: any) => d.examples.length >= 2);
                      
                      return (
                        <div
                          key={project.id}
                          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => selectProject(project)}
                        >
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
                            
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                project.status === 'training' ? 'bg-yellow-100 text-yellow-800' :
                                project.status === 'trained' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {project.status === 'draft' ? 'Draft' :
                                 project.status === 'training' ? 'Training' :
                                 project.status === 'trained' ? 'Trained' :
                                 'Testing'}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(project.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">{project.datasets.length}</div>
                              <div className="text-xs text-gray-600">Labels</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">{totalExamples}</div>
                              <div className="text-xs text-gray-600">Examples</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {isReady ? 'Ready' : 'Incomplete'}
                              </div>
                              <div className="text-xs text-gray-600">Status</div>
                            </div>
                          </div>
                          
                          {project.model && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 font-medium">Model Accuracy:</span>
                                <span className="text-gray-900 font-semibold">{project.model.accuracy}%</span>
                              </div>
                            </div>
                          )}
                          
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
