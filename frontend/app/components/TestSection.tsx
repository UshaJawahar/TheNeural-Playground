'use client';

import { useState } from 'react';
import { Project } from './ProjectCreator';

interface PredictionResult {
  text: string;
  predictedLabel: string;
  confidence: number;
  timestamp: string;
  alternatives: AlternativePrediction[];
}

interface AlternativePrediction {
  label: string;
  confidence: number;
}

interface TestSectionProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onSectionChange: (section: 'train' | 'learn' | 'test') => void;
}

export default function TestSection({ project, onSectionChange }: TestSectionProps) {
  const [testText, setTestText] = useState('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const canTest = project.model && project.model.status === 'trained';

  const makePrediction = () => {
    if (!testText.trim() || !canTest) return;

    setIsPredicting(true);
    setPrediction(null);

    // Simulate prediction delay
    setTimeout(() => {
      // Simple placeholder prediction logic
      const labels = project.model!.labels;
      const randomLabel = labels[Math.floor(Math.random() * labels.length)];
      const confidence = Math.floor(Math.random() * 30) + 70; // Random confidence between 70-100%
      
      // Add some logic to make predictions more realistic based on training data
      let bestLabel = randomLabel;
      let bestConfidence = confidence;
      
      // Check if test text contains words from training examples
      const testWords = testText.toLowerCase().split(' ');
      project.datasets.forEach((dataset) => {
        const labelWords = dataset.examples.join(' ').toLowerCase().split(' ');
        const commonWords = testWords.filter(word => labelWords.includes(word));
        if (commonWords.length > 0) {
          const matchScore = (commonWords.length / testWords.length) * 100;
          if (matchScore > bestConfidence) {
            bestLabel = dataset.label;
            bestConfidence = Math.min(matchScore + Math.random() * 20, 100);
          }
        }
      });

      const newPrediction = {
        text: testText,
        predictedLabel: bestLabel,
        confidence: Math.round(bestConfidence),
        timestamp: new Date().toISOString(),
        alternatives: labels
          .filter(label => label !== bestLabel)
          .map(label => ({
            label,
            confidence: Math.max(0, 100 - bestConfidence - Math.random() * 30)
          }))
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 2)
      };

      setPrediction(newPrediction);
      setIsPredicting(false);
    }, 1500);
  };

  if (!canTest) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          🧪 Test Your Model
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <p className="text-yellow-800 mb-4">
            ⚠️ You need to train your model first before testing.
          </p>
          <button
            onClick={() => onSectionChange('learn')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            ← Go to Training
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          🧪 Test Your Model
        </h2>
        <p className="text-xl text-gray-600">
          Try your trained model with new text inputs
        </p>
      </div>

      {/* Model Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-700 mb-4">
          🤖 Your Trained Model
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Accuracy:</span> {project.model!.accuracy}%
          </div>
          <div>
            <span className="font-medium">Labels:</span> {project.model!.labels.join(', ')}
          </div>
          <div>
            <span className="font-medium">Trained:</span> {new Date(project.model!.trainedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Test Input */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          📝 Test Your Model
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="testText" className="block text-sm font-medium text-gray-700 mb-2">
              Enter text to test:
            </label>
            <textarea
              id="testText"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Type some text here to test your model..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              onKeyPress={(e) => e.key === 'Enter' && makePrediction()}
            />
          </div>
          
          <button
            onClick={makePrediction}
            disabled={!testText.trim() || isPredicting}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {isPredicting ? '🔮 Predicting...' : '🔮 Make Prediction!'}
          </button>
        </div>
      </div>

      {/* Prediction Results */}
      {isPredicting && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <div className="animate-pulse">
            <h3 className="text-xl font-semibold text-yellow-700 mb-3">
              🔮 Analyzing your text...
            </h3>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      {prediction && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-green-700 mb-4">
            🎯 Prediction Results
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Test Text:</h4>
                             <p className="text-gray-800 italic">&quot;{prediction.text}&quot;</p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Top Prediction:</h4>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-green-600">
                  🏆 {prediction.predictedLabel}
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {prediction.confidence}%
                </span>
              </div>
            </div>
            
            {prediction.alternatives.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Other Possibilities:</h4>
                <div className="space-y-2">
                  {prediction.alternatives.map((alt: AlternativePrediction, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600">{alt.label}</span>
                      <span className="text-gray-500">{Math.round(alt.confidence)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setTestText('');
                setPrediction(null);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors mr-3"
            >
              🧪 Test Another Text
            </button>
            <button
              onClick={() => onSectionChange('train')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              ← Improve Training Data
            </button>
          </div>
        </div>
      )}

      {/* Testing Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          💡 Testing Tips
        </h3>
        <ul className="text-gray-600 space-y-2 text-sm">
          <li>• Try different types of text to see how well your model generalizes</li>
          <li>• Test with text similar to your training examples for best results</li>
          <li>• If predictions are poor, consider adding more training data</li>
          <li>• Confidence scores show how certain the model is about its prediction</li>
        </ul>
      </div>

      {/* What the Model Learned */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-indigo-700 mb-3">
          🧠 What Your Model Learned
        </h3>
        <div className="text-indigo-800 space-y-2 text-sm">
          <p>• Your model learned patterns from {project.datasets.reduce((sum, d) => sum + d.examples.length, 0)} training examples</p>
          <p>• It can recognize text patterns and assign them to {project.model!.labels.length} different categories</p>
          <p>• The confidence score shows how similar the test text is to training examples</p>
          <p>• Higher confidence usually means the text is very similar to what it was trained on</p>
        </div>
      </div>
    </div>
  );
}
