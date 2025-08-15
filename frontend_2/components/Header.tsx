'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Zap, Menu, X, Globe } from 'lucide-react'

interface HeaderProps {
  isLoggedIn?: boolean
  currentPage?: string
}

export default function Header({ isLoggedIn = false, currentPage = 'home' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = isLoggedIn
    ? [
        { href: '/about', label: 'About' },
        { href: '/projects', label: 'Projects' },
        { href: '/worksheets', label: 'Worksheets' },
        { href: '/pretrained', label: 'Pretrained' },
        { href: '/stories', label: 'Stories' },
        { href: '/book', label: 'Book' },
        { href: '/help', label: 'Help' },
      ]
    : [
        { href: '/about', label: 'About' },
        { href: '/worksheets', label: 'Worksheets' },
        { href: '/pretrained', label: 'Pretrained' },
        { href: '/stories', label: 'Stories' },
        { href: '/book', label: 'Book' },
        { href: '/help', label: 'Help' },
      ]

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-gray-700 hover:text-gray-900 transition-colors ${
                  currentPage === item.label.toLowerCase() ? 'font-semibold' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <button className="text-gray-700 hover:text-gray-900 transition-colors">
                Log Out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Log In
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-700 hover:text-gray-900">
              <Globe className="w-4 h-4" />
              <span className="text-sm">Language</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-gray-700 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <button className="block py-2 text-gray-700 hover:text-gray-900 transition-colors w-full text-left">
                Log Out
              </button>
            ) : (
              <Link
                href="/login"
                className="block py-2 text-gray-700 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Log In
              </Link>
            )}
            <button className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 py-2">
              <Globe className="w-4 h-4" />
              <span className="text-sm">Language</span>
            </button>
          </div>
        )}
      </nav>
    </header>
  )
}
