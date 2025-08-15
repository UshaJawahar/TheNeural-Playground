import Link from 'next/link'
import Header from '@/components/Header'
import { ArrowLeft } from 'lucide-react'
import { use } from 'react'

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  // In a real app, you'd fetch project details based on the ID
  const project = {
    id,
    name: 'talent-directory',
    type: 'text'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} currentPage="projects" />
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/projects"
          className="inline-flex items-center text-blue-500 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to project
        </Link>

        {/* Project title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          "{project.name}"
        </h1>

        {/* Three main sections */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Train Section */}
          <div className="section-card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Train
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Collect examples of what you want the computer to recognise
            </p>
            <div className="flex justify-center">
              <Link
                href={`/projects/${project.id}/train`}
                className="btn-primary"
              >
                Train
              </Link>
            </div>
          </div>

          {/* Learn & Test Section */}
          <div className="section-card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Learn & Test
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Use the examples to train the computer to recognise {project.type}
            </p>
            <div className="flex justify-center">
              <Link
                href={`/projects/${project.id}/test`}
                className="btn-primary"
              >
                Learn & Test
              </Link>
            </div>
          </div>

          {/* Make Section */}
          <div className="section-card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Make
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Use the machine learning model you've trained to make a game or app, 
              in Scratch, Python, or EduBlocks
            </p>
            <div className="flex justify-center">
              <Link
                href={`/projects/${project.id}/make`}
                className="btn-primary"
              >
                Make
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
