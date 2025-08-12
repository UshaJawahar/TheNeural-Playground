'use client';

import { useState } from 'react';

import { Project } from './ProjectCreator';
import TrainSection from './TrainSection';
import LearnSection from './LearnSection';
import TestSection from './TestSection';

interface TextRecognitionProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export default function TextRecognition({ project, onUpdateProject }: TextRecognitionProps) {
  const [activeSection, setActiveSection] = useState<'train' | 'learn' | 'test'>('train');

  const sections = [
    { 
      id: 'train', 
      label: '🚀 Train', 
      description: 'Create your dataset',
      icon: '📊',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'learn', 
      label: '🧠 Learn', 
      description: 'Train your model',
      icon: '⚡',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'test', 
      label: '🧪 Test', 
      description: 'Test your model',
      icon: '🎯',
      color: 'from-green-500 to-emerald-500'
    },
  ];

  const getSectionStatus = (sectionId: string) => {
    switch (sectionId) {
      case 'train':
        return {
          isComplete: project.datasets.length >= 2 && project.datasets.every(d => d.examples.length >= 2),
          progress: Math.min((project.datasets.length / 2) * 100, 100),
          status: project.datasets.length >= 2 ? 'complete' : 'in-progress'
        };
      case 'learn':
        return {
          isComplete: project.model !== null,
          progress: project.model ? 100 : 0,
          status: project.model ? 'complete' : 'locked'
        };
      case 'test':
        return {
          isComplete: project.model !== null,
          progress: project.model ? 100 : 0,
          status: project.model ? 'complete' : 'locked'
        };
      default:
        return { isComplete: false, progress: 0, status: 'locked' };
    }
  };

  const canAccessSection = (sectionId: string) => {
    if (sectionId === 'train') return true;
    if (sectionId === 'learn') return getSectionStatus('train').isComplete;
    if (sectionId === 'test') return getSectionStatus('learn').isComplete;
    return false;
  };

  return (
    <div className="space-y-8">
      {/* Project Overview */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-purple-800">
              📁 {project.name}
            </h2>
            <p className="text-purple-600">
              Text Recognition Project
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-600">
              Last updated: {new Date(project.updatedAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-purple-500">
              Status: {project.status}
            </div>
          </div>
        </div>
        
        {/* Progress Overview */}
        <div className="grid grid-cols-3 gap-4">
          {sections.map((section) => {
            const status = getSectionStatus(section.id);
            return (
              <div key={section.id} className="text-center">
                <div className="text-2xl mb-2">{section.icon}</div>
                <div className="text-sm font-medium text-purple-700 mb-2">{section.label}</div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      status.isComplete ? 'bg-green-500' : 'bg-purple-400'
                    }`}
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {status.isComplete ? 'Complete' : `${Math.round(status.progress)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex flex-wrap gap-3 justify-center">
          {sections.map((section) => {
            const status = getSectionStatus(section.id);
            const isAccessible = canAccessSection(section.id);
            
            return (
              <button
                key={section.id}
                onClick={() => isAccessible && setActiveSection(section.id as 'train' | 'learn' | 'test')}
                disabled={!isAccessible}
                className={`relative px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeSection === section.id
                    ? `bg-gradient-to-r ${section.color} text-white shadow-lg scale-105`
                    : isAccessible
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl mb-1">{section.icon}</div>
                  <div className="text-sm font-bold">{section.label}</div>
                  <div className="text-xs opacity-80">{section.description}</div>
                </div>
                
                {/* Status Indicator */}
                {status.isComplete && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                
                {/* Lock Icon for Locked Sections */}
                {!isAccessible && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🔒</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Section Content */}
      <div 
        key={activeSection}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
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
      </div>

      {/* Scratch Integration */}
      {project.model && (
        <div 
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center"
        >
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-green-700 mb-4">
              🎮 Ready to Create in Scratch!
            </h3>
            <p className="text-green-800 text-lg mb-6">
              Your AI model is trained and ready! Click &quot;Make It&quot; to open Scratch 3.0 and start building amazing projects with your text recognition model.
            </p>
            
            <button
              onClick={() => {
                // This would integrate with Scratch 3.0
                alert('🎉 This would open Scratch 3.0 with your trained model as blocks!');
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 py-6 rounded-2xl text-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform"
            >
              <div className="flex items-center justify-center space-x-4">
                <span className="text-3xl">🚀</span>
                <span>MAKE IT!</span>
                <span className="text-3xl">🚀</span>
              </div>
            </button>
            
            <div className="mt-6 text-green-700">
              <p className="text-sm font-medium">
                Your model will be available as Scratch blocks for text recognition
              </p>
              <p className="text-xs mt-2 opacity-80">
                Model: {project.model.name} | Accuracy: {project.model.accuracy}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div 
        className="bg-gray-50 border border-gray-200 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
          💡 Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setActiveSection('train')}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            📊 Add Training Data
          </button>
          {project.model && (
            <>
              <button
                onClick={() => setActiveSection('test')}
                className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                🧪 Test Model
              </button>
              <button
                onClick={() => {
                  alert('🎉 This would open Scratch 3.0!');
                }}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                🎮 Open Scratch
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
