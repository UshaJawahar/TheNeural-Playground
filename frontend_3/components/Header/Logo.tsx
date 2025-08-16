interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

export default function Logo({ className = '', size = 'md', theme = 'dark' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const themeClasses = {
    dark: 'text-white',
    light: 'text-gray-800'
  };

  return (
    <div className={`font-bold ${themeClasses[theme]} ${sizeClasses[size]} ${className}`}>
      TheNeural Playground
    </div>
  );
}
