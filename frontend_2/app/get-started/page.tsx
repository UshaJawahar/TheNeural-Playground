'use client'

import Link from 'next/link'
import { useState } from 'react'
import Header from '@/components/Header'
import { HelpCircle } from 'lucide-react'

export default function GetStarted() {
  const [showWhyRegister, setShowWhyRegister] = useState(false)
  const [showForgotDetails, setShowForgotDetails] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Get started with machine learning
        </h1>

        <div className="bg-gray-200 rounded-lg p-8 space-y-8">
          {/* First time here section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              First time here?
            </h2>
            <div className="flex flex-col items-center space-y-3">
              <Link
                href="/signup"
                className="w-64 text-center bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors duration-200 font-medium"
              >
                Sign up
              </Link>
              <button
                onClick={() => setShowWhyRegister(!showWhyRegister)}
                className="text-blue-500 hover:text-blue-600 text-sm underline"
              >
                Why register?
              </button>
              {showWhyRegister && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-600 max-w-md">
                  Registering allows you to save your projects, track your progress, 
                  and access your work from any device. It's free and only takes a minute!
                </div>
              )}
            </div>
          </div>

          {/* Already registered section */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Already registered?
            </h2>
            <div className="flex flex-col items-center space-y-3">
              <Link
                href="/login"
                className="w-64 text-center bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors duration-200 font-medium"
              >
                Log in
              </Link>
              <button
                onClick={() => setShowForgotDetails(!showForgotDetails)}
                className="text-blue-500 hover:text-blue-600 text-sm underline"
              >
                Forgot your details?
              </button>
              {showForgotDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-600 max-w-md">
                  If you've forgotten your login details, please contact your teacher 
                  or the person who set up your account.
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300"></div>

          {/* Try without registering section */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Try without registering
              </h2>
              <div className="relative group">
                <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Limited features available without registration
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Link
                href="/projects?demo=true"
                className="w-64 text-center bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors duration-200 font-medium"
              >
                Try it now
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
