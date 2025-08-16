interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

export default function Logo({ className = '', size = 'md', theme = 'dark' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const themeClasses = {
    dark: 'filter brightness-0 invert', // Makes SVG white for dark theme
    light: 'filter brightness-0' // Makes SVG black for light theme
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/preview.svg" 
        alt="TheNeural Playground Logo" 
        className={`${sizeClasses[size]} ${themeClasses[theme]}`}
      />
      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} ${
        size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
      }`}>
        TheNeural Playground
      </span>
    </div>
  );
}
