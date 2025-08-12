'use client';

import { useState } from 'react';

import { Project, Dataset } from './ProjectCreator';

interface TrainSectionProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onSectionChange: (section: 'train' | 'learn' | 'test') => void;
}

export default function TrainSection({ project, onUpdateProject, onSectionChange }: TrainSectionProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');

  const addLabel = () => {
    if (!newLabel.trim()) return;
    
    const newDataset: Dataset = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      examples: [],
      color: 'bg-blue-500',
    };

    const updatedProject = {
      ...project,
      datasets: [...project.datasets, newDataset],
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    setNewLabel('');
  };

  const addTextExample = () => {
    if (!selectedLabel || !newText.trim()) return;

    const updatedProject = {
      ...project,
      datasets: project.datasets.map(dataset => 
        dataset.label === selectedLabel 
          ? { ...dataset, examples: [...dataset.examples, newText.trim()] }
          : dataset
      ),
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    setNewText('');
  };

  const removeExample = (label: string, exampleIndex: number) => {
    const updatedProject = {
      ...project,
      datasets: project.datasets.map(dataset => 
        dataset.label === label 
          ? { ...dataset, examples: dataset.examples.filter((_, i) => i !== exampleIndex) }
          : dataset
      ),
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updatedProject);
  };

  const removeLabel = (label: string) => {
    const updatedProject = {
      ...project,
      datasets: project.datasets.filter(dataset => dataset.label !== label),
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updatedProject);
    if (selectedLabel === label) {
      setSelectedLabel('');
    }
  };

  const canProceedToLearn = project.datasets.length >= 2 && 
    project.datasets.every(dataset => dataset.examples.length >= 2);

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          🚀 Train Your Dataset
        </h2>
        <p className="text-xl text-gray-600">
          Create labeled examples to teach your AI model
        </p>
      </div>

      {/* Progress */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">Progress</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <span className="text-blue-700">Labels: {project.datasets.length}/2</span>
            <div className="w-full bg-blue-200 rounded-full h-3 mt-2">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${Math.min((project.datasets.length / 2) * 100, 100)}%` }}></div>
            </div>
          </div>
          <div>
            <span className="text-blue-700">Examples: {project.datasets.reduce((sum, d) => sum + d.examples.length, 0)}/4</span>
            <div className="w-full bg-blue-200 rounded-full h-3 mt-2">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${Math.min((project.datasets.reduce((sum, d) => sum + d.examples.length, 0) / 4) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>
        
        {canProceedToLearn && (
          <div className="mt-6 text-center">
            <button
              onClick={() => onSectionChange('learn')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-bold"
            >
              🧠 Ready to Learn! Go to Training →
            </button>
          </div>
        )}
      </div>

      {/* Add Label */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Add New Label</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g., 'happy', 'sad'"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
            onKeyPress={(e) => e.key === 'Enter' && addLabel()}
          />
          <button
            onClick={addLabel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
          >
            Add Label
          </button>
        </div>
      </div>

      {/* Datasets */}
      {project.datasets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800">Your Dataset</h3>
          {project.datasets.map((dataset) => (
            <div key={dataset.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold">{dataset.label}</h4>
                  <button
                    onClick={() => removeLabel(dataset.label)}
                    className="text-white/80 hover:text-white"
                  >
                    ❌
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={selectedLabel === dataset.label ? newText : ''}
                    onChange={(e) => {
                      setSelectedLabel(dataset.label);
                      setNewText(e.target.value);
                    }}
                    placeholder="Add text example..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
                    onKeyPress={(e) => e.key === 'Enter' && addTextExample()}
                  />
                  <button
                    onClick={addTextExample}
                    disabled={selectedLabel !== dataset.label || !newText.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl"
                  >
                    Add
                  </button>
                </div>
                
                {dataset.examples.length > 0 && (
                  <div className="space-y-2">
                    {dataset.examples.map((example, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                        <span>{example}</span>
                        <button
                          onClick={() => removeExample(dataset.label, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
