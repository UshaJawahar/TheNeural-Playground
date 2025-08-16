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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#010101]/95 backdrop-blur-md border-b border-[#b90abd]/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#b90abd] to-[#5332ff] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#b90abd]/25 transition-all duration-300">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-white hover:text-[#b90abd] transition-all duration-300 font-medium text-sm ${
                  currentPage === item.label.toLowerCase() 
                    ? 'text-[#b90abd] font-semibold' 
                    : 'hover:scale-105'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Login & Language */}
          <div className="hidden lg:flex items-center space-x-6">
            {isLoggedIn ? (
              <button className="text-white hover:text-[#b90abd] transition-colors duration-300 font-medium text-sm">
                Log Out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-white hover:text-[#b90abd] transition-colors duration-300 font-medium text-sm"
              >
                Log In
              </Link>
            )}
            
            <button className="flex items-center space-x-2 text-white hover:text-[#b90abd] transition-colors duration-300 group">
              <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-sm font-medium">Language</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-white hover:text-[#b90abd] transition-colors duration-300 p-2"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 bg-[#010101]/98 backdrop-blur-md border-t border-[#b90abd]/20">
            <div className="space-y-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-3 px-4 text-white hover:text-[#b90abd] hover:bg-[#b90abd]/10 rounded-lg transition-all duration-300 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-[#b90abd]/20 pt-3">
                {isLoggedIn ? (
                  <button className="block py-3 px-4 text-white hover:text-[#b90abd] hover:bg-[#b90abd]/10 rounded-lg transition-all duration-300 w-full text-center">
                    Log Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block py-3 px-4 text-white hover:text-[#b90abd] hover:bg-[#b90abd]/10 rounded-lg transition-all duration-300 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log In
                  </Link>
                )}
                <button className="flex items-center justify-center space-x-2 py-3 px-4 text-white hover:text-[#b90abd] hover:bg-[#b90abd]/10 rounded-lg transition-all duration-300 w-full">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Language</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
