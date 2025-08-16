'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';

/**
 * Projects Page with Hash-Based Navigation
 * 
 * URL Structure:
 * - /projects/{userId} - Main projects list (default)
 * - /projects/{userId}#new-project - Create new project form
 * - /projects/{userId}#project-{projectId} - ML Project Section (Train/Test/Make)
 * - /projects/{userId}#project-{projectId}/train - Training section for specific project
 * 
 * Sections:
 * 1. projects-list: Shows existing projects or "No Projects Found" state
 * 2. new-project: Project creation form
 * 3. project-details: ML Project Section with Train/Test/Make cards
 * 4. project-train: Training interface for specific project
 * 
 * Navigation Flow:
 * - Train button → /projects/{userId}#project-{projectId}/train (stays on same page)
 * - Back from Train → /projects/{userId}#project-{projectId} (returns to specific project's ML section)
 * 
 * Note: Training functionality is now integrated into the main page using hash navigation
 */

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



function CreateProjectPage() {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentSection, setCurrentSection] = useState<'projects-list' | 'new-project' | 'project-details'>('projects-list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  


  const params = useParams();
  const urlUserId = params?.userid as string;

  useEffect(() => {
    validateUserSession();
  }, [urlUserId]); // eslint-disable-line react-hooks/exhaustive-deps



  const validateUserSession = () => {
    if (!urlUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const sessionData = localStorage.getItem('neural_playground_session');
      if (sessionData) {
        const session: UserSession = JSON.parse(sessionData);
        const now = Date.now();
        
        // Check if session is still valid and matches URL
        if (now < session.expiresAt && session.userId === urlUserId) {
          setUserSession(session);
          setIsValidSession(true);
          loadUserProjects(session.userId);
        } else if (session.userId !== urlUserId) {
          // Wrong user ID in URL, redirect to correct one
          window.location.href = `/projects/${session.userId}`;
          return;
        } else {
          // Session expired
          localStorage.removeItem('neural_playground_session');
          window.location.href = '/projects';
          return;
        }
      } else {
        // No session, redirect to main projects page
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

  const loadUserProjects = (userId: string) => {
    try {
      const projectsKey = `neural_playground_projects_${userId}`;
      const savedProjects = localStorage.getItem(projectsKey);
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const saveUserProjects = (userId: string, projectsData: Project[]) => {
    try {
      const projectsKey = `neural_playground_projects_${userId}`;
      localStorage.setItem(projectsKey, JSON.stringify(projectsData));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  };

  const handleLanguageChange = (language: string) => {
    console.log('Language changed to:', language);
  };

  const handleLoginClick = () => {
    console.log('Login clicked');
  };

  const handleCreateProject = () => {
    setCurrentSection('new-project');
    // Update URL hash
    window.location.hash = '#new-project';
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim() && projectType && userSession) {
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: projectName.trim(),
        type: projectType,
        createdAt: new Date().toLocaleDateString()
      };
      
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      saveUserProjects(userSession.userId, updatedProjects);
      console.log('Creating project:', newProject);
      
      // Reset form
      setProjectName('');
      setProjectType('');
      
      // Navigate to the new project page
      window.location.href = `/projects/${userSession.userId}/${newProject.id}`;
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (userSession) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      saveUserProjects(userSession.userId, updatedProjects);
    }
  };

  const handleExportProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    console.log('Exporting project:', project);
    // Handle export logic here
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to the project-specific page
    window.location.href = `/projects/${urlUserId}/${project.id}`;
  };

  const handleBackToProjects = () => {
    // Navigate back to projects list
    window.location.href = `/projects/${urlUserId}`;
  };

  const handleCancel = () => {
    setCurrentSection('projects-list');
    setProjectName('');
    setProjectType('');
  };



  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      {/* Header Component */}
      <Header 
        onLanguageChange={handleLanguageChange}
        onLoginClick={handleLoginClick}
      />

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Breadcrumb */}
                      <div className="mb-6 text-sm text-white">
              {currentSection === 'projects-list' && (
                <span>Projects List</span>
              )}
              {currentSection === 'new-project' && (
                <span>Projects List → <span className="text-[#dcfc84]">Create New Project</span></span>
              )}



            </div>
          {isLoading ? (
            /* Loading State */
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-white text-xl">Loading...</div>
            </div>
          ) : !isValidSession ? (
            /* Invalid Session */
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
          ) : (
            /* Valid Session Content */
            <div>
              {currentSection === 'project-details' && selectedProject ? (
            /* ML Project Section */
            <div>
              {/* Project Header with Back Button */}
              <div className="flex items-center mb-12">
                <button
                  onClick={handleBackToProjects}
                  className="p-2 text-white/70 hover:text-white hover:bg-[#bc6cd3]/10 rounded-lg transition-all duration-300 mr-4"
                >
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 19l-7-7 7-7" 
                    />
                  </svg>
                </button>
                <h1 className="text-3xl md:text-4xl font-semibold text-white text-center flex-1">
                  "{selectedProject.name}"
                </h1>
              </div>

              {/* ML Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Train Card */}
                <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-xl p-8 text-center hover:bg-[#bc6cd3]/5 transition-all duration-300">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                    Train
                  </h2>
                  <p className="text-white mb-8 text-sm md:text-base leading-relaxed min-h-[3rem]">
                    Collect examples of what you want the computer to recognise
                  </p>
                                     <button 
                     onClick={() => {
                       window.location.href = `/projects/${userSession?.userId}/${selectedProject.id}/train`;
                     }}
                     className="w-full bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] py-3 px-6 rounded-lg font-medium transition-all duration-300"
                   >
                     Train
                   </button>
                </div>

                {/* Learn & Test Card */}
                <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-xl p-8 text-center hover:bg-[#bc6cd3]/5 transition-all duration-300">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                    Learn & Test
                  </h2>
                  <p className="text-white mb-8 text-sm md:text-base leading-relaxed min-h-[3rem]">
                    Use the examples to train the computer to recognise text
                  </p>
                  <button className="w-full bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] py-3 px-6 rounded-lg font-medium transition-all duration-300">
                    Learn & Test
                  </button>
                </div>

                {/* Make Card */}
                <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-xl p-8 text-center hover:bg-[#bc6cd3]/5 transition-all duration-300">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                    Make
                  </h2>
                  <p className="text-white mb-8 text-sm md:text-base leading-relaxed min-h-[3rem]">
                    Use the machine learning model you've trained to make a game or app, in Scratch, Python, or EduBlocks
                  </p>
                  <button className="w-full bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] py-3 px-6 rounded-lg font-medium transition-all duration-300">
                    Make
                  </button>
                </div>
              </div>
            </div>

          ) : currentSection === 'projects-list' && projects.length === 0 ? (
            /* No Projects State */
            <div className="max-w-4xl mx-auto text-center">
              {/* Plus Icon */}
              <div className="mx-auto w-20 h-20 bg-[#bc6cd3]/20 rounded-full flex items-center justify-center mb-8">
                <svg 
                  className="w-10 h-10 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
              </div>

              {/* No Projects Found Title */}
              <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                No Projects Found
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-white mb-12 max-w-2xl mx-auto">
                You haven't created any projects yet. Start building your AI text recognition model!
              </p>

              {/* Create New Project Button */}
              <button
                onClick={handleCreateProject}
                className="bg-[#dcfc84] text-[#1c1c1c] px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
                Create New Project
              </button>
            </div>
          ) : currentSection === 'projects-list' && projects.length > 0 ? (
            /* Projects Grid */
            <div>
              {/* Header with Add Project Button */}
              <div className="flex justify-end mb-8">
                <button
                  onClick={handleCreateProject}
                  className="bg-[#1c1c1c] border border-[#bc6cd3]/20 text-white px-6 py-3 rounded-lg hover:bg-[#bc6cd3]/10 transition-all duration-300 inline-flex items-center gap-2"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                    />
                  </svg>
                  Add a new project
                </button>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-xl p-6 hover:bg-[#bc6cd3]/5 transition-all duration-300 cursor-pointer"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white truncate flex-1">
                        {project.name}
                      </h3>
                      <div className="flex gap-2 ml-4">
                        {/* Export Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportProject(project.id);
                          }}
                          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                          title="Export project"
                        >
                          <svg 
                            className="w-5 h-5" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" 
                            />
                          </svg>
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="p-2 text-white/70 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                          title="Delete project"
                        >
                          <svg 
                            className="w-5 h-5" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-white mb-4">
                      <span className="text-sm">Recognising </span>
                      <span className="text-[#dcfc84] font-medium">
                        {project.type.replace('Text Recognition', 'text')}
                      </span>
                    </div>
                    
                    <div className="text-xs text-white/50">
                      Created: {project.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentSection === 'new-project' ? (
            /* Project Creation Form */
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                  Create New Project
                </h1>
                <p className="text-lg text-white">
                  Set up your AI project details
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Project Name Input */}
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-white mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-4 py-3 bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#dcfc84] focus:ring-1 focus:ring-[#dcfc84] transition-all duration-300"
                    required
                  />
                </div>

                {/* Project Type Dropdown */}
                <div>
                  <label htmlFor="projectType" className="block text-sm font-medium text-white mb-2">
                    Project Type
                  </label>
                  <select
                    id="projectType"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg text-white focus:outline-none focus:border-[#dcfc84] focus:ring-1 focus:ring-[#dcfc84] transition-all duration-300"
                    required
                  >
                    <option value="" disabled className="bg-[#1c1c1c] text-gray-400">
                      Select Type
                    </option>
                    <option value="Text Recognition" className="bg-[#1c1c1c] text-white">
                      Text Recognition
                    </option>
                  </select>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 border border-[#bc6cd3]/30 text-white rounded-lg hover:bg-[#bc6cd3]/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#dcfc84] text-[#1c1c1c] px-6 py-3 rounded-lg font-medium hover:scale-105 transition-all duration-300"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          ) : null}
            </div>
          )}
        </div>
      </main>


    </div>
  );
}

// Main component that handles user sessions and project management
// Route: /projects/[userId] - where userId is the temporary 96-hour session ID
export default function ProjectPage() {
  return <CreateProjectPage />;
}