"use client";

import React, { useEffect } from "react";

interface DonkeyFailPopupProps {
  show: boolean;
  message?: string;
  onDismiss?: () => void;
}

export const DonkeyFailPopup: React.FC<DonkeyFailPopupProps> = ({
  show,
  message = "¡I-AAAH! 🐴 Wrong move!",
  onDismiss,
}) => {
  useEffect(() => {
    if (show && onDismiss) {
      // Fast dismissal (850ms) so it never lingers or blocks gameplay
      const timer = setTimeout(() => {
        onDismiss();
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    // Positioned at the top-center of the screen, completely clear of bottom decision buttons!
    <div className="fixed top-16 sm:top-20 inset-x-0 mx-auto z-50 pointer-events-none flex justify-center px-4 animate-bounce">
      <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-[#2a1403]/95 via-[#4a2406]/95 to-[#241002]/95 border-2 border-amber-400 py-2 px-3.5 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.65)] max-w-sm backdrop-blur-md">
        {/* Compact Cute Cartoon Donkey Icon */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 filter drop-shadow">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#F59E0B" opacity="0.2" />
            
            {/* Orejas largas de burro */}
            <ellipse
              cx="32"
              cy="25"
              rx="9"
              ry="24"
              transform="rotate(-25 32 25)"
              fill="#8D6E63"
              stroke="#4E342E"
              strokeWidth="2.5"
            />
            <ellipse
              cx="32"
              cy="25"
              rx="5"
              ry="16"
              transform="rotate(-25 32 25)"
              fill="#D7CCC8"
            />

            <ellipse
              cx="68"
              cy="25"
              rx="9"
              ry="24"
              transform="rotate(25 68 25)"
              fill="#8D6E63"
              stroke="#4E342E"
              strokeWidth="2.5"
            />
            <ellipse
              cx="68"
              cy="25"
              rx="5"
              ry="16"
              transform="rotate(25 68 25)"
              fill="#D7CCC8"
            />

            {/* Cabeza */}
            <ellipse
              cx="50"
              cy="55"
              rx="28"
              ry="30"
              fill="#8D6E63"
              stroke="#4E342E"
              strokeWidth="2.5"
            />

            {/* Pelo */}
            <path d="M45,28 Q50,20 55,28 Q50,22 45,28 Z" fill="#3E2723" />

            {/* Ojos saltones */}
            <circle cx="40" cy="48" r="8" fill="#FFFFFF" stroke="#4E342E" strokeWidth="2" />
            <circle cx="60" cy="48" r="8" fill="#FFFFFF" stroke="#4E342E" strokeWidth="2" />
            <circle cx="38" cy="49" r="3.5" fill="#212121" />
            <circle cx="62" cy="47" r="3.5" fill="#212121" />

            {/* Hocico claro */}
            <ellipse
              cx="50"
              cy="68"
              rx="19"
              ry="14"
              fill="#D7CCC8"
              stroke="#4E342E"
              strokeWidth="2"
            />
            <ellipse cx="44" cy="65" rx="3" ry="4" fill="#5D4037" />
            <ellipse cx="56" cy="65" rx="3" ry="4" fill="#5D4037" />

            {/* Sonrisa con dos dientes */}
            <path
              d="M40,73 Q50,81 60,73"
              fill="none"
              stroke="#3E2723"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <rect x="47" y="73" width="3" height="4.5" fill="#FFFFFF" rx="0.5" stroke="#4E342E" strokeWidth="0.8" />
            <rect x="50" y="73" width="3" height="4.5" fill="#FFFFFF" rx="0.5" stroke="#4E342E" strokeWidth="0.8" />
          </svg>
        </div>

        {/* Text Speech Content */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] font-black uppercase text-amber-400 tracking-wider">
              DONKEY ALERT!
            </span>
          </div>
          <div className="text-xs font-black text-white leading-tight truncate">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonkeyFailPopup;
