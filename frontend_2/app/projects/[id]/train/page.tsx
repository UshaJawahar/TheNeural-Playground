'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { ArrowLeft, Plus, X, Download, Upload, FileText } from 'lucide-react'
import { use } from 'react'

interface TrainingData {
  label: string
  examples: string[]
}

export default function TrainProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [labels, setLabels] = useState<TrainingData[]>([
    { label: 'happy', examples: ['laughing'] },
    { label: 'sad', examples: ['crying'] }
  ])
  const [newLabelName, setNewLabelName] = useState('')
  const [showNewLabelInput, setShowNewLabelInput] = useState(false)

  const handleAddLabel = () => {
    if (newLabelName.trim() && !labels.find(l => l.label === newLabelName.trim())) {
      setLabels([...labels, { label: newLabelName.trim(), examples: [] }])
      setNewLabelName('')
      setShowNewLabelInput(false)
    }
  }

  const handleAddExample = (labelIndex: number) => {
    const example = prompt('Enter a new example:')
    if (example && example.trim()) {
      const newLabels = [...labels]
      newLabels[labelIndex].examples.push(example.trim())
      setLabels(newLabels)
    }
  }

  const handleRemoveExample = (labelIndex: number, exampleIndex: number) => {
    const newLabels = [...labels]
    newLabels[labelIndex].examples.splice(exampleIndex, 1)
    setLabels(newLabels)
  }

  const handleRemoveLabel = (labelIndex: number) => {
    if (confirm(`Are you sure you want to remove the "${labels[labelIndex].label}" label?`)) {
      const newLabels = [...labels]
      newLabels.splice(labelIndex, 1)
      setLabels(newLabels)
    }
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

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Recognising <span className="text-blue-600 font-bold">text</span> as{' '}
            {labels.map((label, index) => (
              <span key={label.label}>
                <span className="text-green-600 font-bold">{label.label}</span>
                {index < labels.length - 2 ? ', ' : index === labels.length - 2 ? ' or ' : ''}
              </span>
            ))}
          </h1>
        </div>

        {/* Add new label button */}
        <div className="flex justify-end mb-6">
          {showNewLabelInput ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                placeholder="Enter label name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleAddLabel}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewLabelInput(false)
                  setNewLabelName('')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewLabelInput(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add new label</span>
            </button>
          )}
        </div>

        {/* Training data buckets */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labels.map((label, labelIndex) => (
            <div
              key={label.label}
              className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden"
            >
              {/* Label header */}
              <div className={`p-4 ${labelIndex % 2 === 0 ? 'bg-green-100' : 'bg-red-100'} border-b-2 border-gray-300`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-green-800">{label.label}</h3>
                  <button
                    onClick={() => handleRemoveLabel(labelIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Examples */}
              <div className="p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                {label.examples.map((example, exampleIndex) => (
                  <div
                    key={exampleIndex}
                    className="bg-gray-100 rounded-md px-3 py-2 mb-2 flex justify-between items-center group"
                  >
                    <span className="text-gray-700">{example}</span>
                    <button
                      onClick={() => handleRemoveExample(labelIndex, exampleIndex)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-gray-200 flex justify-center space-x-2">
                <button
                  onClick={() => handleAddExample(labelIndex)}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Add example"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add example</span>
                </button>
                <button
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Add file"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Add file</span>
                </button>
                <button
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download</span>
                </button>
              </div>

              {/* Example count */}
              <div className="text-center pb-4">
                <span className="text-3xl font-bold text-gray-600">
                  {label.examples.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
