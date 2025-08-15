'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { Plus, Copy, Trash2, FolderOpen } from 'lucide-react'
import ProjectCreator from '@/components/ProjectCreator'

interface Project {
  id: string
  name: string
  type: 'text' | 'image' | 'sound' | 'numbers'
  description: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([
    // Example project that would be loaded from API
    {
      id: '1',
      name: 'talent-directory',
      type: 'text',
      description: 'Recognising text'
    }
  ])
  const [showProjectCreator, setShowProjectCreator] = useState(false)

  const handleCreateProject = (project: Omit<Project, 'id'>) => {
    const newProject = {
      ...project,
      id: Date.now().toString()
    }
    setProjects([...projects, newProject])
    setShowProjectCreator(false)
  }

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} currentPage="projects" />
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Your machine learning projects
        </h1>

        {projects.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mb-8">
            <p className="text-blue-700">
              Click the 'plus' button on the right to create your first project! →
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {projects.map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {project.name}
                      </h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Recognising</span>
                        <span className="font-semibold text-blue-600">{project.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-5 h-5 text-gray-400" />
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteProject(project.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="fixed bottom-8 right-8 space-y-4">
          <button
            onClick={() => setShowProjectCreator(true)}
            className="bg-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow duration-200 group"
            title="Add a new project"
          >
            <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
          </button>
          <button
            className="bg-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow duration-200 group"
            title="Copy template"
          >
            <Copy className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
          </button>
        </div>

        {/* Project Creator Modal */}
        {showProjectCreator && (
          <ProjectCreator
            onClose={() => setShowProjectCreator(false)}
            onCreate={handleCreateProject}
          />
        )}
      </main>
    </div>
  )
}
