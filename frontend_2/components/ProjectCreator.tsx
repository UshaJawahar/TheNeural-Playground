'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ProjectCreatorProps {
  onClose: () => void
  onCreate: (project: { name: string; type: string; language: string; storage: string }) => void
}

export default function ProjectCreator({ onClose, onCreate }: ProjectCreatorProps) {
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('text')
  const [language, setLanguage] = useState('English')
  const [storage, setStorage] = useState('browser')

  const handleCreate = () => {
    if (projectName.trim()) {
      onCreate({
        name: projectName,
        type: projectType,
        language,
        storage
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Start a new machine learning project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Name */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my-awesome-project"
            />
          </div>

          {/* Project Type */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Type <span className="text-red-500">*</span>
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">recognising text</option>
              <option value="image">recognising images</option>
              <option value="sound">recognising sounds</option>
              <option value="numbers">recognising numbers</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Chinese">Chinese</option>
            </select>
          </div>

          {/* Storage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage <span className="text-red-500">*</span>
            </label>
            <select
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="browser">In your web browser</option>
              <option value="cloud">In the cloud</option>
            </select>
          </div>

          {/* Info box */}
          <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600">
            <p className="mb-2">Where do you want to store this project?</p>
            <p className="mb-2">
              Storing in your web browser removes limits on how big your project can be.
              Storing in the cloud will let you access the project from any computer.
            </p>
            <p>(See "What difference does it make where a project is stored?")</p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={handleCreate}
              disabled={!projectName.trim()}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                projectName.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              CREATE
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
