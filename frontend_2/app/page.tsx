import Link from 'next/link'
import Header from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left side - Text content */}
          <div className="flex-1 max-w-2xl">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-12 leading-tight">
              Teach a computer to play a game
            </h1>
            
            <div className="flex gap-4 mb-8">
              <Link href="/get-started" className="btn-primary">
                Get started
              </Link>
              <Link href="/learn-more" className="btn-secondary">
                Learn more
              </Link>
            </div>
          </div>

          {/* Right side - Steps */}
          <div className="flex-1 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">1</span>
              </div>
              <p className="text-xl text-gray-700 pt-2">
                Collect examples of things you want to be able to recognise
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">2</span>
              </div>
              <p className="text-xl text-gray-700 pt-2">
                Use the examples to train a computer to be able to recognise them
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">3</span>
              </div>
              <p className="text-xl text-gray-700 pt-2">
                Make a game in Scratch that uses the computer's ability to recognise them
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
