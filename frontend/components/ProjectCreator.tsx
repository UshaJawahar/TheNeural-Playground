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
  hasBeenTested: boolean;
  hasOpenedScratch: boolean;
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
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'hasBeenTested' | 'hasOpenedScratch'>) => void;
}

export default function ProjectCreator({ onCreateProject }: ProjectCreatorProps) {
  const [projectName, setProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedType) return;

    setIsCreating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'hasBeenTested' | 'hasOpenedScratch'> = {
      name: projectName.trim(),
      type: selectedType as 'text-recognition',
      datasets: [],
      model: null,
    };

    onCreateProject(newProject);
    setProjectName('');
    setSelectedType('');
    setShowCreateForm(false);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {!showCreateForm ? (
        <div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create New Project</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900 appearance-none bg-white"
                >
                  <option value="" disabled className="text-gray-500">
                    Select Project Type
                  </option>
                  <option value="text-recognition" className="text-gray-900">Text Recognition</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || !selectedType || isCreating}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm"
            >
              {isCreating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create Project</span>
                </div>
              )}
            </button>
            
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
