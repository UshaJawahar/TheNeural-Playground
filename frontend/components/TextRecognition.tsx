'use client';

import { useState } from 'react';

import { Project } from './ProjectCreator';
import TrainSection from './TrainSection';
import LearnSection from './LearnSection';
import TestSection from './TestSection';
import ScratchGUI from './ScratchGUI';


interface TextRecognitionProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export default function TextRecognition({ project, onUpdateProject }: TextRecognitionProps) {
  const [activeSection, setActiveSection] = useState<'train' | 'learn' | 'test' | 'make'>('train');
  const [showScratchGUI, setShowScratchGUI] = useState(false);

  const sections = [
    { 
      id: 'train', 
      label: 'Train', 
      description: 'Create your dataset'
    },
    { 
      id: 'learn', 
      label: 'Learn', 
      description: 'Train your model'
    },
    { 
      id: 'test', 
      label: 'Test', 
      description: 'Test your model'
    },
    { 
      id: 'make', 
      label: 'Make', 
      description: 'Create in Scratch'
    },
  ];

  const getSectionStatus = (sectionId: string) => {
    switch (sectionId) {
      case 'train':
        return {
          isComplete: project.datasets.length >= 2 && project.datasets.every(d => d.examples.length >= 2),
          progress: Math.min((project.datasets.length / 2) * 100, 100)
        };
      case 'learn':
        return {
          isComplete: project.model !== null,
          progress: project.model ? 100 : 0
        };
      case 'test':
        return {
          isComplete: project.hasBeenTested,
          progress: project.hasBeenTested ? 100 : (project.model ? 50 : 0)
        };
      case 'make':
        return {
          isComplete: project.hasBeenTested,
          progress: project.hasBeenTested ? 100 : 0
        };
      default:
        return { isComplete: false, progress: 0 };
    }
  };

  const canAccessSection = (sectionId: string) => {
    if (sectionId === 'train') return true;
    if (sectionId === 'learn') return getSectionStatus('train').isComplete;
    if (sectionId === 'test') return project.model !== null; // Enable after training, not after completion
    if (sectionId === 'make') return getSectionStatus('test').isComplete; // Enable after testing is done
    return false;
  };

  const handleMakeInScratch = () => {
    if (project.model) {
      setShowScratchGUI(true);
    }
  };

  const handleCloseScratchGUI = () => {
    setShowScratchGUI(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="w-full">
        <div className="grid grid-cols-12 gap-0">
          {/* Left Sidebar - Navigation */}
          <div className="col-span-3 bg-gray-50 border-r border-gray-200 min-h-screen">
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-8">Project Stages</h2>
              <div className="space-y-4">
                {sections.map((section) => {
                  const status = getSectionStatus(section.id);
                  const isAccessible = canAccessSection(section.id);
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => isAccessible && setActiveSection(section.id as 'train' | 'learn' | 'test' | 'make')}
                      disabled={!isAccessible}
                      className={`w-full text-left p-4 transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm'
                          : isAccessible
                          ? 'hover:bg-gray-100 border-l-4 border-transparent'
                          : 'border-l-4 border-transparent cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-blue-100' : 'bg-gray-200'
                        }`}>
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-medium ${
                              isActive ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {section.label}
                            </h3>
                            {status.isComplete && (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${
                            isActive ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            {section.description}
                          </p>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  status.isComplete ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${status.progress}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {status.isComplete ? 'Complete' : `${Math.round(status.progress)}%`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-9">
            {/* Content Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {activeSection === 'train' && 'Train Your Dataset'}
                    {activeSection === 'learn' && 'Train Your Model'}
                    {activeSection === 'test' && 'Test Your Model'}
                    {activeSection === 'make' && 'Create in Scratch'}
                  </h2>
                  <p className="text-gray-600 mt-2 text-lg">
                    {sections.find(s => s.id === activeSection)?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8">
              {activeSection === 'train' && (
                <TrainSection 
                  project={project} 
                  onUpdateProject={onUpdateProject}
                  onSectionChange={setActiveSection}
                />
              )}
              {activeSection === 'learn' && (
                <LearnSection 
                  project={project} 
                  onUpdateProject={onUpdateProject}
                  onSectionChange={setActiveSection}
                />
              )}
              {activeSection === 'test' && (
                <TestSection 
                  project={project} 
                  onUpdateProject={onUpdateProject}
                  onSectionChange={setActiveSection}
                />
              )}
              {activeSection === 'make' && (
                <div className="text-center">
                  <div className="max-w-4xl mx-auto">
                    {project.model ? (
                      <div className="space-y-8">
                        <button
                          onClick={handleMakeInScratch}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Open Scratch 3.0</span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </button>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">
                            Model Information
                          </h4>
                          <div className="grid grid-cols-2 gap-6 text-sm">
                            <div className="text-left">
                              <span className="text-gray-600 font-medium">Model Name:</span>
                              <div className="font-medium text-gray-900 mt-1">{project.model.name}</div>
                            </div>
                            <div className="text-left">
                              <span className="text-gray-600 font-medium">Accuracy:</span>
                              <div className="font-medium text-gray-900 mt-1">{project.model.accuracy}%</div>
                            </div>
                            <div className="text-left">
                              <span className="text-gray-600 font-medium">Labels:</span>
                              <div className="font-medium text-gray-900 mt-1">{project.model.labels.join(', ')}</div>
                            </div>
                            <div className="text-left">
                              <span className="text-gray-600 font-medium">Trained:</span>
                              <div className="font-medium text-gray-900 mt-1">{new Date(project.model.trainedAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <p className="text-yellow-800 mb-4 text-lg">
                          You need to train your model first before creating in Scratch.
                        </p>
                        <button
                          onClick={() => setActiveSection('learn')}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors text-lg font-medium"
                        >
                          Go to Training
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scratch GUI Modal */}
      {showScratchGUI && project.model && (
        <ScratchGUI
          model={project.model}
          onClose={handleCloseScratchGUI}
        />
      )}
    </div>
  );
}
