'use client';

import { useState, useRef } from 'react';

import { Project, Dataset } from './ProjectCreator';

interface TrainSectionProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onSectionChange?: (section: 'train' | 'learn' | 'test') => void;
}

export default function TrainSection({ project, onUpdateProject }: TrainSectionProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    
    try {
      const text = await readFileContent(file);
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const labelName = file.name.split('.')[0] || 'Imported Data';
        
        const newDataset: Dataset = {
          id: Date.now().toString(),
          label: labelName,
          examples: lines,
          color: 'bg-blue-500',
        };

        const updatedProject = {
          ...project,
          datasets: [...project.datasets, newDataset],
          updatedAt: new Date().toISOString(),
        };

        onUpdateProject(updatedProject);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  };



  return (
    <div className="space-y-6">
      {/* Quick Actions - Compact */}
      <div className="grid grid-cols-2 gap-4">
        {/* Add Label */}
        <div className="border border-gray-200 rounded-lg p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Add New Label</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g., 'happy', 'sad'"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && addLabel()}
            />
            <button
              onClick={addLabel}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="border border-gray-200 rounded-lg p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Upload File</h3>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsx,.js,.ts"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {uploadingFile ? 'Uploading...' : 'Choose File'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">CSV, TXT, TSX, JS, TS</p>
        </div>
      </div>

      {/* Professional Dataset Section - No Scrolling */}
      {project.datasets.length > 0 && (
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-3">Your Dataset</h3>
          <div className="grid gap-3">
            {project.datasets.map((dataset) => (
              <div key={dataset.id} className="border border-gray-200 rounded-lg">
                {/* Dataset Header - Compact */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{dataset.label}</h4>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{dataset.examples.length} examples</span>
                    </div>
                    <button
                      onClick={() => removeLabel(dataset.label)}
                      className="text-red-500 hover:text-red-700 text-sm p-1 hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Add Example - Compact */}
                <div className="p-3 border-b border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedLabel === dataset.label ? newText : ''}
                      onChange={(e) => {
                        setSelectedLabel(dataset.label);
                        setNewText(e.target.value);
                      }}
                      placeholder="Add text example..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500"
                      onKeyPress={(e) => e.key === 'Enter' && addTextExample()}
                    />
                    <button
                      onClick={addTextExample}
                      disabled={selectedLabel !== dataset.label || !newText.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                {/* Examples List - Show All Data */}
                {dataset.examples.length > 0 && (
                  <div className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {dataset.examples.map((example, index) => (
                        <div key={index} className="inline-flex items-center bg-gray-50 px-2 py-1 rounded text-xs border border-gray-200 max-w-full">
                          <span className="text-gray-900 truncate max-w-32">{example}</span>
                          <button
                            onClick={() => removeExample(dataset.label, index)}
                            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 hover:bg-red-50 rounded p-0.5"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
