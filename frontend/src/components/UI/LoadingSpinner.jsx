export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin`}></div>
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-r-primary-400 rounded-full animate-spin`} 
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        ></div>
      </div>
    </div>
  );
}

