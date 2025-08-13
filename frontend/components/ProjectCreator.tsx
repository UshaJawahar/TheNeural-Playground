'use client';

import { useState } from 'react';
import { apiService, ProjectCreateRequest } from '@/lib/api';
import { config } from '@/lib/config';


export interface Project {
  id: string;
  name: string;
  type: 'text-recognition';
  datasets: Dataset[];
  dataset?: {
    examples: Array<{
      text: string;
      label: string;
      addedAt: string;
    }>;
    labels: string[];
    records: number;
  };
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
  onCreateProject: (project: Project) => void;
  onError?: (error: string) => void;
}

export default function ProjectCreator({ onCreateProject, onError }: ProjectCreatorProps) {
  const [projectName, setProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedType) return;
    
    // Validate project name length
    if (projectName.trim().length > config.project.maxNameLength) {
      onError?.(`Project name must be ${config.project.maxNameLength} characters or less`);
      return;
    }

    setIsCreating(true);
    
    try {
      // Prepare the API payload with default values
      const projectData: ProjectCreateRequest = {
        name: projectName.trim(),
        description: "",
        type: selectedType as 'text-recognition',
        createdBy: "",
        tags: [],
        notes: "",
        config: {
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001,
          validationSplit: 0.2
        }
      };

      // Call the API to create the project
      const response = await apiService.createProject(projectData);
      
      if (response.success) {
        // Convert API response to frontend Project format
        const newProject: Project = {
          id: response.data.id,
          name: response.data.name,
          type: response.data.type as 'text-recognition',
          datasets: [],
          dataset: response.data.dataset || { examples: [], labels: [], records: 0 },
          model: null,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
          status: response.data.status as 'draft' | 'training' | 'trained' | 'testing',
          hasBeenTested: false,
          hasOpenedScratch: false
        };

        onCreateProject(newProject);
        setProjectName('');
        setSelectedType('');
        setShowCreateForm(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      onError?.(errorMessage);
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
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
                Project Name *
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                maxLength={config.project.maxNameLength}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <p className="text-xs text-gray-500 mt-1">
                {projectName.length}/{config.project.maxNameLength} characters
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type *
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
                  {config.project.supportedTypes.map(type => (
                    <option key={type} value={type} className="text-gray-900">
                      {type === 'text-recognition' ? 'Text Recognition' : type}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Default Configuration Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-blue-800 text-sm">
                <p className="font-medium">Default Configuration</p>
                <p>Epochs: 100, Batch Size: 32, Learning Rate: 0.001, Validation Split: 0.2</p>
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
