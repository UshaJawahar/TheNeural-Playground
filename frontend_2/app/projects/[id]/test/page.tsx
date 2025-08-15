'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { ArrowLeft, Send } from 'lucide-react'
import { use } from 'react'

interface Prediction {
  label: string
  confidence: number
}

export default function TestProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [testText, setTestText] = useState('')
  const [predictions, setPredictions] = useState<Prediction[] | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [modelTrained, setModelTrained] = useState(false)

  const handleTrain = async () => {
    setIsTraining(true)
    // Simulate training
    setTimeout(() => {
      setIsTraining(false)
      setModelTrained(true)
    }, 3000)
  }

  const handleTest = () => {
    if (!testText.trim() || !modelTrained) return

    // Simulate model prediction
    const mockPredictions: Prediction[] = [
      { label: 'happy', confidence: Math.random() * 0.5 + 0.5 },
      { label: 'sad', confidence: Math.random() * 0.5 }
    ].sort((a, b) => b.confidence - a.confidence)

    setPredictions(mockPredictions)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} currentPage="projects" />
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center text-blue-500 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to project
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Learn & Test
        </h1>

        <div className="max-w-4xl mx-auto">
          {/* Training Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Train your model
            </h2>
            <p className="text-gray-600 mb-4">
              Use your training data to create a machine learning model that can recognize text.
            </p>
            <button
              onClick={handleTrain}
              disabled={isTraining || modelTrained}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                isTraining
                  ? 'bg-yellow-500 text-white cursor-wait'
                  : modelTrained
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isTraining ? 'Training...' : modelTrained ? 'Model Trained ✓' : 'Train Model'}
            </button>
          </div>

          {/* Testing Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Test your model
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="test-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter text to classify:
                </label>
                <div className="flex space-x-2">
                  <input
                    id="test-input"
                    type="text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTest()}
                    placeholder="Type something to test..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!modelTrained}
                  />
                  <button
                    onClick={handleTest}
                    disabled={!modelTrained || !testText.trim()}
                    className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                      !modelTrained || !testText.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Test</span>
                  </button>
                </div>
              </div>

              {/* Predictions */}
              {predictions && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Predictions:
                  </h3>
                  <div className="space-y-3">
                    {predictions.map((prediction, index) => (
                      <div key={prediction.label} className="flex items-center justify-between">
                        <span className={`text-lg ${index === 0 ? 'font-bold' : ''}`}>
                          {prediction.label}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-48 bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full ${
                                index === 0 ? 'bg-green-500' : 'bg-gray-400'
                              } transition-all duration-500 ease-out`}
                              style={{ width: `${prediction.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-[50px] text-right">
                            {(prediction.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!modelTrained && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    You need to train your model before you can test it.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
