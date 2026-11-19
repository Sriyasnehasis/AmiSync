"use client";

import React from 'react';

interface SiteLogoProps {
  className?: string;
  animated?: boolean;
}

export const SiteLogo: React.FC<SiteLogoProps> = ({ className = "w-10 h-10", animated = true }) => {
  return (
    <div className={`${className} shrink-0`} style={{ flexShrink: 0 }}>
      <style>{`
        @keyframes cz-in {
          0%   { opacity: 0; transform: scale(0.6) rotate(-12deg); }
          65%  { opacity: 1; transform: scale(1.07) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes cz-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-2px); }
        }
        .cz-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .cz-animated {
          animation:
            cz-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
            cz-float 3.5s ease-in-out 0.7s infinite;
        }
      `}</style>
      <img
        src="/amisync-logo.png"
        alt="AmiSync"
        className={`cz-img${animated ? ' cz-animated' : ''}`}
        draggable={false}
      />
    </div>
  );
};
