import React from 'react';

interface AppIconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export const AppIcon: React.FC<AppIconProps> = ({ className = '', size = 'md' }) => {
  return (
    <div
      className={`relative shrink-0 select-none overflow-hidden rounded-xl shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30 flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#064e3b] to-[#022c22] ${SIZES[size]} ${className}`}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        <defs>
          <linearGradient id="appPulseGrad" x1="8" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <filter id="appGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Orbit Dots */}
        <circle cx="12" cy="12" r="1.5" fill="#38bdf8" opacity="0.8" />
        <circle cx="36" cy="12" r="1.5" fill="#34d399" opacity="0.8" />
        <circle cx="36" cy="36" r="1.5" fill="#10b981" opacity="0.8" />
        <circle cx="12" cy="36" r="1.5" fill="#059669" opacity="0.8" />

        {/* Pulse waveform / signal */}
        <path
          d="M10 24h5l3-7 5 14 4-9 3 4 8-2"
          stroke="url(#appPulseGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#appGlow)"
        />

        {/* Pulse beacon signal */}
        <circle cx="38" cy="24" r="2.5" fill="#38bdf8" filter="url(#appGlow)" />
      </svg>
    </div>
  );
};
