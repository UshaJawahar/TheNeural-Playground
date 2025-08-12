'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();

  const goToProjects = () => {
    router.push('/projects');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left Side - Main Heading */}
          <div className="flex-1 max-w-md">
            <h1 className="text-5xl font-bold text-gray-800 leading-tight mb-8">
              Teach a<br />
              computer to<br />
              play a game
            </h1>
            
            <button
              onClick={goToProjects}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              Go to your Projects
            </button>
          </div>

          {/* Right Side - Steps List */}
          <div className="flex-1 max-w-md ml-16">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <span className="text-3xl font-bold text-purple-700">1</span>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Collect examples of things you<br />
                  want to be able to recognise
                </p>
              </div>
              
              <div className="flex items-start space-x-4">
                <span className="text-3xl font-bold text-purple-700">2</span>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Use the examples to train a<br />
                  computer to be able to recognise<br />
                  them
                </p>
              </div>
              
              <div className="flex items-start space-x-4">
                <span className="text-3xl font-bold text-purple-700">3</span>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Make a game in Scratch that uses<br />
                  the computer's ability to recognise<br />
                  them
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
