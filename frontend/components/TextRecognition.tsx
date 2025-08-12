'use client';

import { useState } from 'react';

import { Project } from './ProjectCreator';
import TrainSection from './TrainSection';
import LearnSection from './LearnSection';
import TestSection from './TestSection';
import ScratchGUI from './ScratchGUI';
import { MLModel } from './MLScratchExtension';

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
      description: 'Create your dataset',
      icon: '📊'
    },
    { 
      id: 'learn', 
      label: 'Learn', 
      description: 'Train your model',
      icon: '⚡'
    },
    { 
      id: 'test', 
      label: 'Test', 
      description: 'Test your model',
      icon: '🎯'
    },
    { 
      id: 'make', 
      label: 'Make', 
      description: 'Create in Scratch',
      icon: '🎮'
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
          isComplete: project.model !== null,
          progress: project.model ? 100 : 0
        };
      case 'make':
        return {
          isComplete: project.model !== null,
          progress: project.model ? 100 : 0
        };
      default:
        return { isComplete: false, progress: 0 };
    }
  };

  const canAccessSection = (sectionId: string) => {
    if (sectionId === 'train') return true;
    if (sectionId === 'learn') return getSectionStatus('train').isComplete;
    if (sectionId === 'test') return getSectionStatus('learn').isComplete;
    if (sectionId === 'make') return getSectionStatus('learn').isComplete;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600">Text Recognition Project</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Last updated: {new Date(project.updatedAt).toLocaleDateString()}
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-1">
                {project.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar - Navigation */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Stages</h2>
              <div className="space-y-3">
                {sections.map((section) => {
                  const status = getSectionStatus(section.id);
                  const isAccessible = canAccessSection(section.id);
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => isAccessible && setActiveSection(section.id as 'train' | 'learn' | 'test' | 'make')}
                      disabled={!isAccessible}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                          : isAccessible
                          ? 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                          : 'bg-gray-100 border-2 border-transparent cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-blue-100' : 'bg-gray-200'
                        }`}>
                          <span className="text-lg">{section.icon}</span>
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
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Content Header */}
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {activeSection === 'train' && 'Train Your Dataset'}
                      {activeSection === 'learn' && 'Train Your Model'}
                      {activeSection === 'test' && 'Test Your Model'}
                      {activeSection === 'make' && 'Create in Scratch'}
                    </h2>
                    <p className="text-gray-600 mt-1">
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
                    <div className="max-w-2xl mx-auto">
                      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎮</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Ready to Create in Scratch!
                      </h3>
                      
                      <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                        Your AI model is trained and ready! Click the button below to open Scratch 3.0 and start building amazing projects with your text recognition model.
                      </p>
                      
                      {project.model ? (
                        <div className="space-y-6">
                          <button
                            onClick={handleMakeInScratch}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 rounded-xl text-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <div className="flex items-center justify-center space-x-3">
                              <span className="text-2xl">🎮</span>
                              <span>Open Scratch 3.0</span>
                              <span className="text-2xl">🎮</span>
                            </div>
                          </button>
                          
                          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              Model Information
                            </h4>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                <span className="text-gray-600">Model Name:</span>
                                <div className="font-medium text-gray-900">{project.model.name}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Accuracy:</span>
                                <div className="font-medium text-gray-900">{project.model.accuracy}%</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Labels:</span>
                                <div className="font-medium text-gray-900">{project.model.labels.join(', ')}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Trained:</span>
                                <div className="font-medium text-gray-900">{new Date(project.model.trainedAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                          <p className="text-yellow-800 mb-4">
                            ⚠️ You need to train your model first before creating in Scratch.
                          </p>
                          <button
                            onClick={() => setActiveSection('learn')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors"
                          >
                            ← Go to Training
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
