'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { ArrowLeft, ExternalLink, Code, Blocks, BookOpen } from 'lucide-react'
import { use } from 'react'

export default function MakeProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [selectedPlatform, setSelectedPlatform] = useState<'scratch' | 'python' | 'edublocks'>('scratch')

  const handleOpenScratch = () => {
    // In a real app, this would open Scratch with the ML extension loaded
    window.open('https://scratch.mit.edu/', '_blank')
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
          Make
        </h1>

        <div className="max-w-5xl mx-auto">
          {/* Platform Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Choose your coding platform
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedPlatform('scratch')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPlatform === 'scratch'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Blocks className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <h3 className="font-semibold">Scratch 3</h3>
                <p className="text-sm text-gray-600 mt-1">Block-based coding</p>
              </button>
              
              <button
                onClick={() => setSelectedPlatform('python')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPlatform === 'python'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Code className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Python</h3>
                <p className="text-sm text-gray-600 mt-1">Text-based coding</p>
              </button>

              <button
                onClick={() => setSelectedPlatform('edublocks')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPlatform === 'edublocks'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">EduBlocks</h3>
                <p className="text-sm text-gray-600 mt-1">Block-based Python</p>
              </button>
            </div>
          </div>

          {/* Platform-specific content */}
          {selectedPlatform === 'scratch' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Use your model in Scratch
                </h2>
                <p className="text-gray-600 mb-6">
                  Your machine learning model has been prepared for use in Scratch. 
                  Click the button below to open Scratch with your ML extension loaded.
                </p>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Your ML blocks will include:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <code className="bg-gray-100 px-2 py-1 rounded">recognize text [___]</code> - Returns the label</li>
                    <li>• <code className="bg-gray-100 px-2 py-1 rounded">recognize text [___] label</code> - Returns the predicted label</li>
                    <li>• <code className="bg-gray-100 px-2 py-1 rounded">recognize text [___] confidence</code> - Returns confidence score</li>
                  </ul>
                </div>

                <button
                  onClick={handleOpenScratch}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Open in Scratch 3</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Getting Started Tips
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">1.</span>
                    Look for the "Machine Learning" category in the blocks palette
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">2.</span>
                    Use the text recognition blocks to check what label your text belongs to
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">3.</span>
                    Create sprites that react differently based on the recognized text
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">4.</span>
                    Try making a chatbot, mood detector, or text-based game!
                  </li>
                </ul>
              </div>
            </div>
          )}

          {selectedPlatform === 'python' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Python API
              </h2>
              <p className="text-gray-600 mb-4">
                Use your trained model in Python with our simple API.
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{`import requests

# Your API endpoint
API_URL = "https://api.theneural-playground.com/predict/${id}"

# Make a prediction
def predict_text(text):
    response = requests.post(API_URL, json={"text": text})
    return response.json()

# Example usage
result = predict_text("I am so happy today!")
print(f"Label: {result['label']}")
print(f"Confidence: {result['confidence']}")`}</code>
              </pre>
            </div>
          )}

          {selectedPlatform === 'edublocks' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                EduBlocks
              </h2>
              <p className="text-gray-600 mb-6">
                Use block-based Python coding with EduBlocks to work with your ML model.
              </p>
              <button className="btn-primary flex items-center space-x-2">
                <span>Open in EduBlocks</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
