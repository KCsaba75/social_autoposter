import React from 'react';
import { Facebook, Instagram, Youtube, AtSign } from 'lucide-react';
import { Platform } from '../types';

interface PlatformIconProps {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 'md',
  className = '',
}) => {
  const sizeClass =
    size === 'sm'
      ? 'w-3.5 h-3.5'
      : size === 'lg'
        ? 'w-5 h-5'
        : 'w-4 h-4';

  switch (platform) {
    case 'facebook':
      return <Facebook className={`${sizeClass} text-[#1877F2] ${className}`} />;
    case 'instagram':
      return <Instagram className={`${sizeClass} text-[#E1306C] ${className}`} />;
    case 'threads':
      return <AtSign className={`${sizeClass} text-zinc-100 ${className}`} />;
    case 'youtube':
      return <Youtube className={`${sizeClass} text-[#FF0000] ${className}`} />;
    default:
      return null;
  }
};
