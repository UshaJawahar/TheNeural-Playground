'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import config from '../lib/config';
import { 
  getSessionIdFromMaskedId, 
  isMaskedId, 
  generateMaskedId, 
  storeMaskedIdMapping 
} from '../lib/session-utils';

interface GuestSession {
  session_id: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
  ip_address?: string;
  user_agent?: string;
  last_active?: string;
}

interface GuestSessionResponse {
  success: boolean;
  data: GuestSession;
}

export default function Home() {
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [userSessionId, setUserSessionId] = useState<string>('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedSessionId = localStorage.getItem('neural_playground_session_id');
      
      if (!storedSessionId) {
        setIsCheckingSession(false);
        return;
      }

      // Check if session is expired based on 7-day rule
      const sessionCreatedAt = localStorage.getItem('neural_playground_session_created');
      if (sessionCreatedAt) {
        const createdDate = new Date(parseInt(sessionCreatedAt));
        const now = new Date();
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff >= 7) {
          // Session is older than 7 days, clean it up
          console.log('Session expired after 7 days, cleaning up');
          localStorage.removeItem('neural_playground_session_id');
          localStorage.removeItem('neural_playground_session_created');
          setIsCheckingSession(false);
          return;
        }
      }

      // Validate session with backend
      const response = await fetch(`${config.apiBaseUrl}${config.api.guests.sessionById(storedSessionId)}`);
      
      if (response.ok) {
        const sessionResponse: GuestSessionResponse = await response.json();
        if (sessionResponse.success && sessionResponse.data.active) {
          const now = new Date();
          const expiresAt = new Date(sessionResponse.data.expiresAt);
          
          if (now < expiresAt) {
            // Session is valid, generate masked ID and set state
            const maskedId = generateMaskedId(storedSessionId);
            storeMaskedIdMapping(maskedId, storedSessionId);
            setUserSessionId(maskedId);
            setHasActiveSession(true);
          } else {
            // Session expired on backend
            console.log('Session expired on backend');
            localStorage.removeItem('neural_playground_session_id');
            localStorage.removeItem('neural_playground_session_created');
          }
        } else {
          // Session inactive
          console.log('Session inactive on backend');
          localStorage.removeItem('neural_playground_session_id');
          localStorage.removeItem('neural_playground_session_created');
        }
      } else {
        // Session not found on server
        console.log('Session not found on server');
        localStorage.removeItem('neural_playground_session_id');
        localStorage.removeItem('neural_playground_session_created');
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      // Don't remove session on network errors, just don't show as active
    }
    
    setIsCheckingSession(false);
  };

  const getProjectsUrl = () => {
    if (hasActiveSession && userSessionId) {
      return `/projects/${userSessionId}`;
    }
    return '/projects';
  };

  const getButtonText = () => {
    if (isCheckingSession) {
      return 'Loading...';
    }
    if (hasActiveSession) {
      return 'Go to Projects →';
    }
    return 'Get Started →';
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      {/* Header Component */}
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Teach a computer to{' '}
            <span className="text-[#dcfc84]">
              play a game
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white mb-12 max-w-4xl mx-auto">
            Discover the fascinating world of machine learning through interactive game development. 
            Learn, create, and train AI models in an engaging Scratch environment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href={getProjectsUrl()}
              className={`px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 text-center ${
                isCheckingSession 
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                  : 'bg-[#dcfc84] text-[#1c1c1c] hover:scale-105'
              }`}
            >
              {getButtonText()}
            </Link>
            <Link 
              href="/about"
              className="border border-[#bc6cd3] text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-[#bc6cd3] hover:text-[#1c1c1c] transition-all duration-300 text-center"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">How It Works</h2>
            <p className="text-xl text-white max-w-3xl mx-auto">
              Follow these three simple steps to create your own AI-powered game
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Collect Examples",
                description: "Gather training data by collecting examples of objects, actions, or patterns you want your AI to recognize."
              },
              {
                number: "2", 
                title: "Train Your Model",
                description: "Use our intuitive training interface to teach your computer to recognize the patterns in your examples."
              },
              {
                number: "3",
                title: "Create & Play", 
                description: "Build exciting games in Scratch that leverage your trained AI model for interactive gameplay experiences."
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-8 h-full">
                  <div className="w-12 h-12 bg-[#dcfc84] rounded-full flex items-center justify-center text-[#1c1c1c] font-bold text-lg mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">{step.title}</h3>
                  <p className="text-white">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Ready to Start Your AI Journey?
          </h2>
          <p className="text-xl text-white mb-12">
            Join thousands of students and educators who are already creating amazing AI-powered projects.
          </p>
          <Link 
            href={getProjectsUrl()}
            className={`px-12 py-4 rounded-lg text-xl font-medium transition-all duration-300 inline-block text-center ${
              isCheckingSession 
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                : 'bg-[#dcfc84] text-[#1c1c1c] hover:scale-105'
            }`}
          >
            {hasActiveSession ? 'Go to Your Projects' : 'Start Creating Now'}
          </Link>
        </div>
      </section>

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
