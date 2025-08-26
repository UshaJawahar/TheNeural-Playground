interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

export default function Logo({ className = '', size = 'md', theme = 'dark' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-8',
    md: 'h-8 w-12',
    lg: 'h-10 w-16'
  };



  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/Neural Logo-Light Green.png" 
        alt="TheNeural Playground Logo" 
        className={`${sizeClasses[size]}`}
      />
      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} ${
        size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
      }`}>
        TheNeural Playground
      </span>
    </div>
  );
}
