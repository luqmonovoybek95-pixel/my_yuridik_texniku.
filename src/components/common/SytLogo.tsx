import React from 'react';

interface SytLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'dark' | 'light';
  className?: string;
}

export const SytLogo: React.FC<SytLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'dark',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/syt-logo.svg"
        alt="Sirdaryo Yuridik Texnikumi rasmiy logotipi"
        className={`${sizeMap[size]} object-contain shrink-0 filter drop-shadow-xs`}
        loading="eager"
      />
      {showText && (
        <div className="leading-tight">
          <div
            className={`font-black uppercase tracking-wider text-xs sm:text-sm ${
              textColor === 'light' ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            Sirdaryo Yuridik Texnikumi
          </div>
          <div
            className={`text-[10px] sm:text-[11px] font-semibold tracking-tight ${
              textColor === 'light' ? 'text-amber-400' : 'text-blue-900 dark:text-amber-400'
            }`}
          >
            Elektron ta’lim tizimi
          </div>
        </div>
      )}
    </div>
  );
};
