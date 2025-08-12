'use client';

import { useState } from 'react';
import ProjectCreator, { Project } from './components/ProjectCreator';
import TextRecognition from './components/TextRecognition';

export default function Home() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

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
    setCurrentProject(newProject);
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-700 mb-2">
            🚀 AI Playground for Kids
          </h1>
          <p className="text-lg text-gray-600">
            Create amazing projects and learn about artificial intelligence!
          </p>
        </header>

        {/* Main Content */}
        {!currentProject ? (
          <ProjectCreator onCreateProject={createProject} projects={projects} onSelectProject={selectProject} />
        ) : (
          <div>
            {/* Project Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-purple-700">
                    📁 {currentProject.name}
                  </h2>
                  <p className="text-gray-600">
                    Text Recognition Project
                  </p>
                </div>
                <button
                  onClick={() => setCurrentProject(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Projects
                </button>
              </div>
            </div>

            {/* Text Recognition Component */}
            <TextRecognition 
              project={currentProject} 
              onUpdateProject={(updatedProject: Project) => {
                setCurrentProject(updatedProject);
                setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
