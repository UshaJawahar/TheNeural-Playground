'use client';

import { useState } from 'react';


export interface Project {
  id: string;
  name: string;
  type: 'text-recognition';
  datasets: Dataset[];
  model: TrainedModel | null;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'training' | 'trained' | 'testing';
}

export interface Dataset {
  id: string;
  label: string;
  examples: string[];
  color: string;
}

export interface TrainedModel {
  id: string;
  name: string;
  accuracy: number;
  labels: string[];
  trainedAt: string;
  status: 'trained' | 'failed';
  version: string;
}

interface ProjectCreatorProps {
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

const PROJECT_COLORS = [
  'bg-gradient-to-r from-blue-500 to-purple-600',
  'bg-gradient-to-r from-green-500 to-blue-600',
  'bg-gradient-to-r from-purple-500 to-pink-600',
  'bg-gradient-to-r from-orange-500 to-red-600',
  'bg-gradient-to-r from-teal-500 to-green-600',
  'bg-gradient-to-r from-indigo-500 to-purple-600',
];

export default function ProjectCreator({ onCreateProject, projects, onSelectProject }: ProjectCreatorProps) {
  const [projectName, setProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<'text-recognition'>('text-recognition');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    setIsCreating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
      name: projectName.trim(),
      type: selectedType,
      datasets: [],
      model: null,
    };

    onCreateProject(newProject);
    setProjectName('');
    setShowCreateForm(false);
    setIsCreating(false);
  };

  const getProjectStatusBadge = (project: Project) => {
    const statusConfig = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      training: { label: 'Training', color: 'bg-yellow-100 text-yellow-800' },
      trained: { label: 'Trained', color: 'bg-green-100 text-green-800' },
      testing: { label: 'Testing', color: 'bg-blue-100 text-blue-800' },
    };
    
    const config = statusConfig[project.status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getProjectStats = (project: Project) => {
    const totalExamples = project.datasets.reduce((sum, dataset) => sum + dataset.examples.length, 0);
    const isReady = project.datasets.length >= 2 && project.datasets.every(d => d.examples.length >= 2);
    
    return { totalExamples, isReady };
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div 
        className="text-center"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          🚀 AI Playground
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create amazing AI projects and learn about machine learning in a fun, interactive way!
        </p>
      </div>

      {/* Create New Project */}
      <div 
        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            🎯 Start Your AI Journey
          </h2>
          <p className="text-gray-600">
            Create your first project and begin exploring the world of artificial intelligence
          </p>
        </div>
        
        {!showCreateForm ? (
          <div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 rounded-xl text-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform"
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">✨</span>
                <span>Create New Project</span>
                <span className="text-2xl">✨</span>
              </div>
            </button>
          </div>
        ) : (
          <div
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-3">
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., My First AI Model, Emotion Detector..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Project Type
                </label>
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as 'text-recognition')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 text-lg appearance-none bg-white"
                  >
                    <option value="text-recognition">📝 Text Recognition</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || isCreating}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>✅</span>
                    <span>Create Project</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Projects */}
      {projects.length > 0 && (
        <div 
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              📚 Your Projects
            </h2>
            <p className="text-gray-600">
              Continue working on your AI projects
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => {
              const stats = getProjectStats(project);
              const colorClass = PROJECT_COLORS[index % PROJECT_COLORS.length];
              
              return (
                <div
                  key={project.id}
                  className="group cursor-pointer"
                  onClick={() => onSelectProject(project)}
                >
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                      {/* Project Header */}
                      <div className={`${colorClass} p-6 text-white`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold">{project.name}</h3>
                          <span className="text-2xl">📁</span>
                        </div>
                        <p className="text-white/90 text-sm">
                          {project.type === 'text-recognition' ? 'Text Recognition' : project.type}
                        </p>
                      </div>
                      
                      {/* Project Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          {getProjectStatusBadge(project)}
                          <span className="text-xs text-gray-500">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Labels:</span>
                            <span className="font-semibold">{project.datasets.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Examples:</span>
                            <span className="font-semibold">{stats.totalExamples}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-semibold ${stats.isReady ? 'text-green-600' : 'text-yellow-600'}`}>
                              {stats.isReady ? 'Ready' : 'Incomplete'}
                            </span>
                          </div>
                        </div>
                        
                        {project.model && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-700 font-medium">Model Accuracy:</span>
                              <span className="text-green-800 font-bold">{project.model.accuracy}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Project Type Info */}
      <div 
        className="bg-gradient-to-r from-blue-50 to-indigo-200 rounded-2xl p-8"
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-blue-800 mb-3">
            ℹ️ About Text Recognition Projects
          </h3>
          <p className="text-blue-700 text-lg">
            Learn how to build AI models that can understand and categorize text
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h4 className="font-semibold text-blue-800">Create Datasets</h4>
                <p className="text-blue-700 text-sm">Build labeled examples to teach your AI model</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🧠</span>
              <div>
                <h4 className="font-semibold text-blue-800">Train Models</h4>
                <p className="text-blue-700 text-sm">Use machine learning to create intelligent systems</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🧪</span>
              <div>
                <h4 className="font-semibold text-blue-800">Test & Improve</h4>
                <p className="text-blue-700 text-sm">Evaluate performance and enhance accuracy</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎮</span>
              <div>
                <h4 className="font-semibold text-blue-800">Use in Scratch</h4>
                <p className="text-blue-700 text-sm">Integrate with Scratch 3.0 for creative projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
