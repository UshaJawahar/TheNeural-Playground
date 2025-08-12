'use client';

import { useState } from 'react';
import { Project, TrainedModel } from './ProjectCreator';

interface LearnSectionProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onSectionChange: (section: 'train' | 'learn' | 'test') => void;
}

export default function LearnSection({ project, onUpdateProject, onSectionChange }: LearnSectionProps) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState('');

  const canStartTraining = project.datasets.length >= 2 && 
    project.datasets.every((dataset) => dataset.examples.length >= 2);

  const startTraining = () => {
    if (!canStartTraining) return;

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStatus('Initializing model...');

    // Simulate training process
    const trainingSteps = [
      'Loading training data...',
      'Preprocessing text...',
      'Training neural network...',
      'Optimizing parameters...',
      'Finalizing model...',
      'Training complete!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < trainingSteps.length) {
        setTrainingStatus(trainingSteps[currentStep]);
        setTrainingProgress((currentStep + 1) * (100 / trainingSteps.length));
        currentStep++;
      } else {
        clearInterval(interval);
        setIsTraining(false);
        setTrainingProgress(100);
        
        // Create a simple placeholder model
        const trainedModel: TrainedModel = {
          id: Date.now().toString(),
          name: `${project.name} Text Recognition Model`,
          accuracy: Math.floor(Math.random() * 20) + 80, // Random accuracy between 80-100%
          labels: project.datasets.map((d) => d.label),
          trainedAt: new Date().toISOString(),
          status: 'trained',
          version: '1.0.0'
        };

        const updatedProject: Project = {
          ...project,
          model: trainedModel,
          status: 'trained' as const,
          updatedAt: new Date().toISOString()
        };
        onUpdateProject(updatedProject);
      }
    }, 1500);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Training Status */}
      {!project.model && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-black mb-4">
            Ready to Train Your Model
          </h3>
          
          {canStartTraining ? (
            <div className="text-center">
              <p className="text-black mb-4">
                Your dataset is ready! You have {project.datasets.length} labels with examples.
              </p>
              <button
                onClick={startTraining}
                disabled={isTraining}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl text-xl font-bold transition-colors disabled:cursor-not-allowed"
              >
                {isTraining ? 'Training...' : 'Start Training!'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-600 mb-4">
                You need at least 2 labels with 2+ examples each to start training.
              </p>
              <button
                onClick={() => onSectionChange('train')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
              >
                Go Back to Training Data
              </button>
            </div>
          )}
        </div>
      )}

      {/* Training Progress */}
      {isTraining && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-black mb-4">
            Training in Progress...
          </h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-black mb-2">
              <span className="font-medium">Progress</span>
              <span className="font-medium">{Math.round(trainingProgress)}%</span>
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-3">
              <div 
                className="bg-yellow-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${trainingProgress}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-black text-center font-medium">
            {trainingStatus}
          </p>
        </div>
      )}

      {/* Training Results */}
      {project.model && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-black mb-4">
            Training Complete!
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-black mb-2">Model Info</h4>
              <p className="text-sm text-black">Name: {project.model.name}</p>
              <p className="text-sm text-black">Accuracy: {project.model.accuracy}%</p>
              <p className="text-sm text-black">Labels: {project.model.labels.join(', ')}</p>
              <p className="text-sm text-black">Trained: {new Date(project.model.trainedAt).toLocaleString()}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-black mb-2">Dataset Summary</h4>
              <p className="text-sm text-black">Total Labels: {project.datasets.length}</p>
              <p className="text-sm text-black">Total Examples: {project.datasets.reduce((sum, d) => sum + d.examples.length, 0)}</p>
              <p className="text-sm text-black">Average per Label: {Math.round(project.datasets.reduce((sum, d) => sum + d.examples.length, 0) / project.datasets.length)}</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => onSectionChange('test')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors mr-3"
            >
              Test Your Model
            </button>
            <button
              onClick={() => onSectionChange('train')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Improve Training Data
            </button>
          </div>
        </div>
      )}

      {/* Training Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-black mb-3">
          Training Tips
        </h3>
        <ul className="text-black space-y-2 text-sm">
          <li>• More training examples usually lead to better accuracy</li>
          <li>• Try to have balanced examples across all labels</li>
          <li>• Use diverse text examples to improve generalization</li>
          <li>• You can always go back and add more training data</li>
        </ul>
      </div>

      {/* What Happens During Training */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-black mb-3">
          What Happens During Training?
        </h3>
        <div className="text-black space-y-2 text-sm">
          <p>• Your text examples are converted to numerical features</p>
          <p>• A neural network learns patterns in your data</p>
          <p>• The model adjusts its parameters to minimize errors</p>
          <p>• Finally, it learns to predict labels for new text inputs</p>
        </div>
      </div>
    </div>
  );
}
