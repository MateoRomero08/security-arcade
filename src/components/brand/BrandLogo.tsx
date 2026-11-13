import React from "react";
import Image from "next/image";
import { BRAND_CONFIG } from "@/config/brand";

interface BrandLogoProps {
  variant?: "light" | "dark" | "default";
  className?: string;
  svgClassName?: string;
  showTagline?: boolean;
  overrideUrl?: string | null;
}

/**
 * Componente <BrandLogo />
 * 
 * Lee la URL de configuración. Si no hay logo cargado ni fallback SVG activo,
 * muestra un recuadro placeholder visible con el texto "LOGO AQUÍ" (~160x48px).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "default",
  className = "",
  svgClassName = "h-9 w-auto",
  showTagline = false,
  overrideUrl,
}) => {
  const logoUrl = overrideUrl !== undefined ? overrideUrl : BRAND_CONFIG.logo.url;

  // 1. Si hay una URL de imagen subida (por ejemplo en Supabase Storage o enlace directo)
  if (logoUrl) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <div className="relative w-[160px] h-[48px]">
          <Image
            src={logoUrl}
            alt={BRAND_CONFIG.companyName}
            fill
            sizes="160px"
            className="object-contain"
            priority
          />
        </div>
        {showTagline && (
          <span className="text-[11px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
            {BRAND_CONFIG.appName}
          </span>
        )}
      </div>
    );
  }

  // 2. Si está activado el fallback con el SVG oficial de InTouchCX
  if (BRAND_CONFIG.logo.useOfficialSvgFallback) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <svg
          className={`${svgClassName} transition-all duration-300`}
          viewBox="0 0 285 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label={BRAND_CONFIG.companyName}
        >
          {/* Arcos concéntricos verde neón */}
          <path
            d="M10 54V33C10 19.7452 20.7452 9 34 9C47.2548 9 58 19.7452 58 33V54"
            stroke="var(--brand-primary, #43E568)"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <path
            d="M21.5 54V33.5C21.5 26.5964 27.0964 21 34 21C40.9036 21 46.5 26.5964 46.5 33.5V54"
            stroke="var(--brand-primary, #43E568)"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <rect
            x="30.5"
            y="34"
            width="7"
            height="23"
            rx="3.5"
            fill="var(--brand-primary, #43E568)"
          />
          {/* Texto "Intouch" */}
          <text
            x="72"
            y="51"
            fill={variant === "light" ? "#051B0B" : "#FFFFFF"}
            fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
            fontWeight="800"
            fontSize="41"
            letterSpacing="-1.2"
          >
            Intouch
          </text>
          {/* Bloque superíndice "CX" */}
          <rect
            x="228"
            y="13"
            width="44"
            height="24"
            rx="2.5"
            fill={variant === "light" ? "#051B0B" : "#FFFFFF"}
          />
          <text
            x="250"
            y="30.5"
            fill={variant === "light" ? "#FFFFFF" : "var(--brand-bg, #051B0B)"}
            fontFamily="var(--font-sans, 'Plus Jakarta Sans', sans-serif)"
            fontWeight="900"
            fontSize="18.5"
            textAnchor="middle"
            letterSpacing="-0.5"
          >
            CX
          </text>
        </svg>

        {showTagline && (
          <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
            {BRAND_CONFIG.appName}
          </span>
        )}
      </div>
    );
  }

  // 3. Recuadro placeholder visible con "LOGO AQUÍ" (~160x48px)
  const isLight = variant === "light";
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`w-[160px] h-[48px] rounded-xl border-2 border-dashed flex items-center justify-center font-mono text-xs font-bold tracking-wider select-none transition-colors ${
          isLight
            ? "border-slate-400 bg-slate-100 text-slate-700"
            : "border-brand-primary/50 bg-brand-primary/10 text-brand-primary"
        }`}
      >
        <span>{BRAND_CONFIG.logo.placeholderText}</span>
      </div>

      {showTagline && (
        <span className="text-[11px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
          {BRAND_CONFIG.appName}
        </span>
      )}
    </div>
  );
};

export default BrandLogo;

