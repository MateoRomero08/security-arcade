import React from "react";

export type AuditorMood = "happy" | "neutral" | "suspicious" | "angry" | "shocked";

interface MascotAuditorProps {
  mood?: AuditorMood;
  size?: number;
  className?: string;
  showClipboard?: boolean;
}

export const MascotAuditor: React.FC<MascotAuditorProps> = ({
  mood = "happy",
  size = 64,
  className = "",
  showClipboard = false,
}) => {
  // Configuración de boca y cejas según el mood
  let mouthPath = "M49 74 Q60 81 71 74"; // Sonrisa feliz
  let eyebrowLeft = "M40 45 L54 44";
  let eyebrowRight = "M66 44 L80 45";
  let eyeLeft = <circle cx="49" cy="54" r="2.8" fill="#051B0B" />;
  let eyeRight = <circle cx="71" cy="54" r="2.8" fill="#051B0B" />;

  if (mood === "suspicious") {
    mouthPath = "M52 74 L68 73"; // Línea recta pensativa
    eyebrowLeft = "M40 43 L54 47"; // Ceja izquierda arqueada
    eyebrowRight = "M66 43 L80 43";
  } else if (mood === "angry") {
    mouthPath = "M50 77 Q60 71 70 77"; // Ceño fruncido / descontento
    eyebrowLeft = "M41 43 L55 48"; // Cejas inclinadas hacia adentro
    eyebrowRight = "M65 48 L79 43";
  } else if (mood === "shocked") {
    mouthPath = "M60 72 A 4 5 0 1 0 60 82 A 4 5 0 1 0 60 72"; // Boca abierta
    eyebrowLeft = "M39 42 L53 40"; // Cejas elevadas
    eyebrowRight = "M67 40 L81 42";
    eyeLeft = <circle cx="49" cy="54" r="3.6" fill="#051B0B" />;
    eyeRight = <circle cx="71" cy="54" r="3.6" fill="#051B0B" />;
  } else if (mood === "neutral") {
    mouthPath = "M51 74 L69 74";
  }

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Fondo circular con borde verde arcade */}
        <circle
          cx="60"
          cy="60"
          r="56"
          fill="#0D2E16"
          stroke="var(--brand-primary, #43E568)"
          strokeWidth="3.5"
        />

        {/* Traje corporativo del auditor */}
        <path
          d="M24 108C29 86 43 80 60 80C77 80 91 86 96 108"
          fill="#051B0B"
        />
        {/* Corbata verde arcade */}
        <polygon points="60,80 54,94 60,107 66,94" fill="var(--brand-primary, #43E568)" />
        <polygon points="56,80 64,80 62,84 58,84" fill="#58F27B" />

        {/* Cabeza / Rostro */}
        <rect
          x="36"
          y="28"
          width="48"
          height="50"
          rx="22"
          fill="#FDBA74"
          stroke="#051B0B"
          strokeWidth="2.5"
        />

        {/* Cabello formal peinado de lado */}
        <path
          d="M36 44C36 28 46 22 60 22C74 22 84 28 84 44C80 35 72 33 60 33C48 33 40 35 36 44Z"
          fill="#334155"
        />

        {/* Gafas de marco cuadrado de auditor */}
        <rect
          x="40"
          y="48"
          width="17"
          height="13"
          rx="3"
          fill="#FFFFFF"
          fillOpacity="0.75"
          stroke="#051B0B"
          strokeWidth="2.8"
        />
        <rect
          x="63"
          y="48"
          width="17"
          height="13"
          rx="3"
          fill="#FFFFFF"
          fillOpacity="0.75"
          stroke="#051B0B"
          strokeWidth="2.8"
        />
        <line
          x1="57"
          y1="54"
          x2="63"
          y2="54"
          stroke="#051B0B"
          strokeWidth="2.8"
        />

        {/* Cejas */}
        <path d={eyebrowLeft} stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
        <path d={eyebrowRight} stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />

        {/* Ojos */}
        {eyeLeft}
        {eyeRight}

        {/* Bigote clásico de auditor respetable */}
        <path
          d="M44 68C49 63 56 64 60 67C64 64 71 63 76 68C72 71 64 71 60 69C56 71 48 71 44 68Z"
          fill="#334155"
        />

        {/* Boca animada */}
        <path
          d={mouthPath}
          stroke="#051B0B"
          strokeWidth="2.5"
          fill={mood === "shocked" ? "#7f1d1d" : "none"}
          strokeLinecap="round"
        />

        {/* Portapapeles opcional */}
        {showClipboard && (
          <g transform="translate(76, 70)">
            <rect x="0" y="0" width="28" height="38" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
            <rect x="3" y="6" width="22" height="28" rx="1.5" fill="#FEF3C7" />
            <rect x="8" y="-2" width="12" height="6" rx="1" fill="#9CA3AF" />
            <line x1="6" y1="12" x2="22" y2="12" stroke="#4B5563" strokeWidth="1.5" />
            <line x1="6" y1="18" x2="18" y2="18" stroke="#4B5563" strokeWidth="1.5" />
            <line x1="6" y1="24" x2="20" y2="24" stroke="var(--brand-primary, #43E568)" strokeWidth="1.8" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default MascotAuditor;

