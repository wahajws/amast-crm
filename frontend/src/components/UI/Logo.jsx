export default function Logo({ size = 'md', showText = true }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Network/Molecular Logo */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Central node */}
          <circle cx="50" cy="50" r="8" fill="#0073e6" className="network-node" />
          
          {/* Top, Bottom, Left, Right nodes */}
          <circle cx="50" cy="20" r="6" fill="#4da6ff" className="network-node" />
          <circle cx="50" cy="80" r="6" fill="#4da6ff" className="network-node" />
          <circle cx="20" cy="50" r="6" fill="#4da6ff" className="network-node" />
          <circle cx="80" cy="50" r="6" fill="#4da6ff" className="network-node" />
          
          {/* Corner nodes */}
          <circle cx="30" cy="30" r="5" fill="#80bfff" className="network-node" />
          <circle cx="70" cy="30" r="5" fill="#80bfff" className="network-node" />
          <circle cx="30" cy="70" r="5" fill="#80bfff" className="network-node" />
          <circle cx="70" cy="70" r="5" fill="#80bfff" className="network-node" />
          
          {/* Connection lines */}
          <line x1="50" y1="50" x2="50" y2="20" stroke="#0073e6" strokeWidth="1.5" opacity="0.3" />
          <line x1="50" y1="50" x2="50" y2="80" stroke="#0073e6" strokeWidth="1.5" opacity="0.3" />
          <line x1="50" y1="50" x2="20" y2="50" stroke="#0073e6" strokeWidth="1.5" opacity="0.3" />
          <line x1="50" y1="50" x2="80" y2="50" stroke="#0073e6" strokeWidth="1.5" opacity="0.3" />
          <line x1="50" y1="50" x2="30" y2="30" stroke="#0073e6" strokeWidth="1.5" opacity="0.3" />
          <line x1="50" y1="50" x2="70" y2="30" stroke="#0073e6" strokeWidth="1.5" opacity="0.3" />
          <line x1="50" y1="50" x2="30" y2="70" stroke="#0073e6" strokeWidth="1.5" opacity="0.3" />
          <line x1="50" y1="50" x2="70" y2="70" stroke="#0073e6" strokeWidth="1.5" opacity="0.3" />
        </svg>
      </div>
      
      {showText && (
        <span className="text-2xl font-bold text-gray-900">AMAST</span>
      )}
    </div>
  );
}







