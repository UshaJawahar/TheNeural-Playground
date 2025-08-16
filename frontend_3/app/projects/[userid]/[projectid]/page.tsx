'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../../components/Header';

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

export default function ProjectDetailsPage() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  const params = useParams();
  const urlUserId = params?.userid as string;
  const urlProjectId = params?.projectid as string;

  useEffect(() => {
    validateUserSession();
  }, [urlUserId, urlProjectId]);

  const validateUserSession = () => {
    if (!urlUserId || !urlProjectId) {
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
          loadProject(session.userId, urlProjectId);
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

  const loadProject = (userId: string, projectId: string) => {
    try {
      const projectsKey = `neural_playground_projects_${userId}`;
      const savedProjects = localStorage.getItem(projectsKey);
      if (savedProjects) {
        const projects: Project[] = JSON.parse(savedProjects);
        const project = projects.find(p => p.id === projectId);
        if (project) {
          setSelectedProject(project);
        } else {
          window.location.href = `/projects/${userId}`;
          return;
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const handleLanguageChange = (language: string) => {
    console.log('Language changed to:', language);
  };

  const handleLoginClick = () => {
    console.log('Login clicked');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#010101] to-[#0a0a0a] text-white">
        <Header 
          onLanguageChange={handleLanguageChange}
          onLoginClick={handleLoginClick}
        />
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
      <div className="min-h-screen bg-gradient-to-b from-[#010101] to-[#0a0a0a] text-white">
        <Header 
          onLanguageChange={handleLanguageChange}
          onLoginClick={handleLoginClick}
        />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Invalid Session or Project
            </h1>
            <p className="text-lg text-[#d6d9d8] mb-8">
              Please return to your projects and try again.
            </p>
            <a 
              href={`/projects/${urlUserId}`}
              className="bg-gradient-to-r from-[#b90abd] to-[#5332ff] text-white px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 hover:shadow-lg transition-all duration-300 inline-block"
            >
              Back to Projects
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010101] to-[#0a0a0a] text-white">
      <Header 
        onLanguageChange={handleLanguageChange}
        onLoginClick={handleLoginClick}
      />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Breadcrumb */}
          <div className="mb-6 text-sm text-[#d6d9d8]">
            <span>
              <a href={`/projects/${urlUserId}`} className="hover:text-white transition-colors">
                Projects List
              </a>
            </span>
            <span className="mx-2">→</span>
            <span className="text-white">"{selectedProject.name}"</span>
          </div>

          {/* Project Header with Back Button */}
          <div className="flex items-center mb-12">
            <a
              href={`/projects/${urlUserId}`}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 mr-4"
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
            </a>
            <h1 className="text-3xl md:text-4xl font-semibold text-white text-center flex-1">
              "{selectedProject.name}"
            </h1>
          </div>

          {/* ML Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Train Card */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Train
              </h2>
              <p className="text-[#d6d9d8] mb-8 text-sm md:text-base leading-relaxed min-h-[3rem]">
                Collect examples of what you want the computer to recognise
              </p>
              <button 
                onClick={() => {
                  window.location.href = `/projects/${userSession?.userId}/${selectedProject.id}/train`;
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300"
              >
                Train
              </button>
            </div>

            {/* Learn & Test Card */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Learn & Test
              </h2>
              <p className="text-[#d6d9d8] mb-8 text-sm md:text-base leading-relaxed min-h-[3rem]">
                Use the examples to train the computer to recognise text
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300">
                Learn & Test
              </button>
            </div>

            {/* Make Card */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Make
              </h2>
              <p className="text-[#d6d9d8] mb-8 text-sm md:text-base leading-relaxed min-h-[3rem]">
                Use the machine learning model you've trained to make a game or app, in Scratch, Python, or EduBlocks
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300">
                Make
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
