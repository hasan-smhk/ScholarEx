import React from 'react';
import { PAGE_THEMES, PageTexture, ThemeName } from './pageThemes';

interface PageBackgroundProps {
  theme: ThemeName;
  children: React.ReactNode;
  texture?: PageTexture;
  className?: string;
}

export default function PageBackground({
  theme,
  children,
  texture = 'dots',
  className = '',
}: PageBackgroundProps) {
  const config = PAGE_THEMES[theme];
  const isDark = ['booking', 'success', 'cbse', 'icse', 'stateboard', 'skills'].includes(theme);

  return (
    <div className={`scholar-themed-page relative isolate min-h-screen ${className}`} style={{ background: config.gradient }}>
      {texture === 'dots' && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1.5px 1.5px, ${config.textureColor} 1.5px, transparent 1.5px)`,
            backgroundSize: '36px 36px',
          }}
        />
      )}
      {texture === 'grid' && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(${config.textureColor} 1px, transparent 1px), linear-gradient(90deg, ${config.textureColor} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      )}
      <div className={`relative z-10${isDark ? ' text-white' : ''}`}>{children}</div>
    </div>
  );
}