'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';

interface UserSession {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export default function ProjectsPage() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on component mount
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const sessionData = localStorage.getItem('neural_playground_session');
      if (sessionData) {
        const session: UserSession = JSON.parse(sessionData);
        const now = Date.now();
        
        // Check if session is still valid (within 96 hours)
        if (now < session.expiresAt) {
          setUserSession(session);
        } else {
          // Session expired, remove it
          localStorage.removeItem('neural_playground_session');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem('neural_playground_session');
    }
    setIsLoading(false);
  };

  const createUserSession = () => {
    const now = Date.now();
    const userId = `user_${now}_${Math.random().toString(36).substr(2, 9)}`;
    const session: UserSession = {
      userId,
      createdAt: now,
      expiresAt: now + (96 * 60 * 60 * 1000) // 96 hours in milliseconds
    };

    localStorage.setItem('neural_playground_session', JSON.stringify(session));
    setUserSession(session);
    return userId;
  };

  const handleLanguageChange = (language: string) => {
    console.log('Language changed to:', language);
    // Handle language change logic here
  };

  const handleLoginClick = () => {
    console.log('Login clicked');
    // Handle login logic here
  };

  const handleTryNow = () => {
    if (userSession) {
      // User has existing session, go to their projects
      window.location.href = `/projects/${userSession.userId}`;
    } else {
      // Create new session and redirect
      const userId = createUserSession();
      window.location.href = `/projects/${userId}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      {/* Header Component */}
      <Header 
        onLanguageChange={handleLanguageChange}
        onLoginClick={handleLoginClick}
      />

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-8">
            Get started with machine learning
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white mb-12">
            Try without registering
          </p>
          
          {/* Try It Now / Go to Projects Button */}
          <button 
            onClick={handleTryNow}
            disabled={isLoading}
            className="bg-[#dcfc84] text-[#1c1c1c] px-10 py-4 rounded-lg text-xl font-medium hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : userSession ? 'Go to your projects' : 'Try it now'}
          </button>
          
          {userSession && (
            <p className="text-sm text-white mt-4">
              Welcome back! Session expires on{' '}
              {new Date(userSession.expiresAt).toLocaleDateString()} at{' '}
              {new Date(userSession.expiresAt).toLocaleTimeString()}
            </p>
          )}
          
          {/* Optional additional content section */}
          <div className="mt-20">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-center text-white">🎮 Create Games</h3>
                <p className="text-white text-center">
                  Build interactive games using Scratch and machine learning
                </p>
              </div>
              
              <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-center text-white">🤖 Train AI</h3>
                <p className="text-white text-center">
                  Teach computers to recognize patterns and make decisions
                </p>
              </div>
              
              <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-center text-white">📚 Learn</h3>
                <p className="text-white text-center">
                  Understand machine learning concepts through hands-on projects
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1c1c1c] border-t border-[#bc6cd3]/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-white">
            © 2024 TheNeural Playground. Empowering the next generation of AI creators.
          </p>
        </div>
      </footer>
    </div>
  );
}
