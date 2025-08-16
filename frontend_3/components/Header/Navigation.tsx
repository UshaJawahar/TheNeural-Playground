interface NavigationProps {
  links?: string[];
  className?: string;
  isMobile?: boolean;
  theme?: 'dark' | 'light';
}

const defaultLinks = ['About', 'Worksheets', 'Pretrained', 'Stories', 'Book', 'Help'];

export default function Navigation({ 
  links = defaultLinks, 
  className = '', 
  isMobile = false,
  theme = 'dark'
}: NavigationProps) {
  const baseClasses = theme === 'dark' 
    ? "text-white hover:text-[#dcfc84] px-3 py-2 rounded-md font-medium transition-all duration-300"
    : "text-gray-700 hover:text-[#dcfc84] px-3 py-2 rounded-md font-medium transition-all duration-300";
  
  const desktopClasses = "text-sm";
  const mobileClasses = "text-base block";
  
  const containerClasses = isMobile 
    ? "space-y-1" 
    : "ml-10 flex items-baseline space-x-8";

  return (
    <div className={`${containerClasses} ${className}`}>
      {links.map((link) => (
        <a
          key={link}
          href="#"
          className={`${baseClasses} ${isMobile ? mobileClasses : desktopClasses}`}
        >
          {link}
        </a>
      ))}
    </div>
  );
}
