import Navigation from './Navigation';
import LoginButton from './LoginButton';
import LanguageSelector from './LanguageSelector';

interface MobileMenuProps {
  isOpen: boolean;
  links?: string[];
  className?: string;
  onLanguageChange?: (value: string) => void;
  onLoginClick?: () => void;
}

export default function MobileMenu({ 
  isOpen, 
  links,
  className = '',
  onLanguageChange,
  onLoginClick
}: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className={`md:hidden ${className}`}>
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#1c1c1c] border-t border-[#bc6cd3]/20">
        <Navigation links={links} isMobile={true} />
        
        <div className="flex items-center space-x-4 px-3 py-2 border-t border-[#bc6cd3]/20 mt-4 pt-4">
          <LoginButton 
            variant="mobile" 
            onClick={onLoginClick}
          />
          <LanguageSelector 
            onChange={onLanguageChange}
          />
        </div>
      </div>
    </div>
  );
}
