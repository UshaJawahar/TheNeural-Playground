'use client';

import { useRouter } from 'next/navigation';

interface HeaderProps {
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
}

export default function Header({ 
  showBackButton = false, 
  backButtonText = "← Back to Home",
  onBackClick 
}: HeaderProps) {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.push('/');
    }
  };

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              AI Playground
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Home
            </button>
            <button
              onClick={() => router.push('/projects')}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Projects
            </button>
          </nav>

          {/* Back Button (if needed) */}
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              {backButtonText}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
