
import React from 'react';

export const DriverLogo: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Circular Frame */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" strokeDasharray="220 100" strokeLinecap="round" opacity="0.1" />
      <path d="M15 75 A 40 40 0 1 1 85 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* Driver Silhouette */}
      <g fill="currentColor">
        {/* Head and Hair */}
        <path d="M50 15 C42 15 35 22 35 30 C35 38 42 45 50 45 C58 45 65 38 65 30 C65 22 58 15 50 15 Z" />
        <path d="M35 30 C35 20 45 15 55 15 C60 15 65 20 65 30 L65 35 L35 35 Z" opacity="0.9" />
        
        {/* Shoulders and Suit */}
        <path d="M25 80 C25 65 35 50 50 50 C65 50 75 65 75 80 L25 80 Z" />
        
        {/* Shirt and Tie (Inverted colors via clipping or subtraction) */}
        <path d="M42 50 L50 70 L58 50 Z" fill="white" />
        <path d="M48 50 L50 62 L52 50 Z" fill="currentColor" />
      </g>

      {/* Steering Wheel */}
      <g transform="translate(30, 65)">
        <circle cx="20" cy="15" r="18" stroke="white" strokeWidth="4" fill="none" />
        <circle cx="20" cy="15" r="5" fill="white" />
        <path d="M20 15 L20 33 M20 15 L5 15 M20 15 L35 15" stroke="white" strokeWidth="3" strokeLinecap="round" />
        
        {/* Hands on Wheel */}
        <rect x="2" y="10" width="8" height="10" rx="4" fill="currentColor" />
        <rect x="30" y="10" width="8" height="10" rx="4" fill="currentColor" />
      </g>
    </svg>
  );
};
