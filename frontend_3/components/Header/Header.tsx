'use client';

import { useState } from 'react';
import Logo from './Logo';
import Navigation from './Navigation';
import HeaderActions from './HeaderActions';
import MobileMenuButton from './MobileMenuButton';
import MobileMenu from './MobileMenu';

interface HeaderProps {
  className?: string;
  logoSize?: 'sm' | 'md' | 'lg';
  navigationLinks?: string[];
  showLogin?: boolean;
  showLanguageSelector?: boolean;
  showMobileMenu?: boolean;
  fixed?: boolean;
  transparent?: boolean;
  theme?: 'dark' | 'light';
  onLanguageChange?: (value: string) => void;
  onLoginClick?: () => void;
}

export default function Header({
  className = '',
  logoSize = 'md',
  navigationLinks,
  showLogin = true,
  showLanguageSelector = true,
  showMobileMenu = true,
  fixed = true,
  transparent = false,
  theme = 'dark',
  onLanguageChange,
  onLoginClick
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerClasses = `
    ${fixed ? 'fixed top-0' : 'relative'} 
    w-full z-50 
    ${transparent ? 'bg-transparent' : className.includes('bg-white') ? className : 'bg-[#1c1c1c]'} 
    ${className.includes('border-gray-200') ? className.includes('border-b') ? '' : 'border-b border-gray-200' : 'border-b border-[#bc6cd3]/20'} 
    backdrop-blur-sm
    ${className}
  `.trim();

  return (
    <header className={headerClasses}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo size={logoSize} theme={theme} />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Navigation links={navigationLinks} theme={theme} />
          </div>
          
          {/* Desktop Actions */}
          <HeaderActions
            className="hidden md:flex"
            showLogin={showLogin}
            showLanguageSelector={showLanguageSelector}
            onLanguageChange={onLanguageChange}
            onLoginClick={onLoginClick}
          />

          {/* Mobile menu button */}
          {showMobileMenu && (
            <div className="md:hidden">
              <MobileMenuButton
                isOpen={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              />
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <MobileMenu
            isOpen={mobileMenuOpen}
            links={navigationLinks}
            onLanguageChange={onLanguageChange}
            onLoginClick={onLoginClick}
          />
        )}
      </nav>
    </header>
  );
}
