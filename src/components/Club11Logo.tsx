/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface Club11LogoProps {
  className?: string;
  showText?: boolean;
  color?: string;
  glow?: boolean;
}

export default function Club11Logo({ 
  className = "w-32 h-32", 
  showText = true, 
  color = "currentColor",
  glow = false
}: Club11LogoProps) {
  if (!showText) {
    // Just the elegant circular emblem with needles
    return (
      <svg 
        viewBox="50 100 300 100" 
        className={`${className} ${glow ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Tapered Needle */}
        <path 
          d="M 60 150 L 135 147 L 180 150 L 135 153 Z" 
          fill={color} 
        />
        
        {/* Outer Ring */}
        <circle 
          cx="200" 
          cy="150" 
          r="40" 
          stroke={color} 
          strokeWidth="2" 
          fill="none" 
        />
        
        {/* Inner Solid Circle */}
        <circle 
          cx="200" 
          cy="150" 
          r="33" 
          fill={color} 
        />
        
        {/* The Serif 11 */}
        <text 
          x="200" 
          y="164" 
          textAnchor="middle" 
          fontFamily="'Playfair Display', 'Georgia', serif" 
          fontWeight="900" 
          fontSize="42" 
          fill="currentColor"
          className="text-slate-950 dark:text-slate-950 light:text-white"
          style={{ fill: color === 'currentColor' ? undefined : '#0f172a' }}
        >
          11
        </text>

        {/* Right Tapered Needle */}
        <path 
          d="M 220 150 L 265 147 L 340 150 L 265 153 Z" 
          fill={color} 
        />
      </svg>
    );
  }

  // Full high-fidelity logo including CLUB and ÚJBUDA text matching their original brand logo
  return (
    <svg 
      viewBox="0 0 400 300" 
      className={`${className} ${glow ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Text: CLUB */}
      <text 
        x="200" 
        y="75" 
        textAnchor="middle" 
        fontFamily="'Playfair Display', 'Georgia', 'Times New Roman', serif" 
        fontWeight="bold" 
        fontSize="56" 
        letterSpacing="16" 
        dx="8"
        fill={color}
      >
        CLUB
      </text>

      {/* Left Tapered Needle */}
      <path 
        d="M 25 150 L 95 147 L 148 150 L 95 153 Z" 
        fill={color} 
      />
      
      {/* Outer Ring */}
      <circle 
        cx="200" 
        cy="150" 
        r="44" 
        stroke={color} 
        strokeWidth="2.5" 
        fill="none" 
      />
      
      {/* Inner Solid Circle */}
      <circle 
        cx="200" 
        cy="150" 
        r="36" 
        fill={color} 
      />
      
      {/* Serif 11 */}
      <text 
        x="200" 
        y="166" 
        textAnchor="middle" 
        fontFamily="'Playfair Display', 'Georgia', 'Times New Roman', serif" 
        fontWeight="900" 
        fontSize="46" 
        className="fill-slate-950 dark:fill-slate-950"
      >
        11
      </text>

      {/* Right Tapered Needle */}
      <path 
        d="M 252 150 L 305 147 L 375 150 L 305 153 Z" 
        fill={color} 
      />

      {/* Bottom Text: ÚJBUDA */}
      <text 
        x="200" 
        y="238" 
        textAnchor="middle" 
        fontFamily="'Playfair Display', 'Georgia', 'Times New Roman', serif" 
        fontWeight="bold" 
        fontSize="48" 
        letterSpacing="14" 
        dx="7"
        fill={color}
      >
        ÚJBUDA
      </text>
    </svg>
  );
}
