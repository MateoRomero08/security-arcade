/**
 * CONTROL CENTRAL DE MARCA Y TEMA VISUAL
 * 
 * Todo el estilo visual, paleta de colores, tipografía, logo y textos de identidad
 * se controlan desde este único archivo.
 * 
 * Las variables CSS en `src/app/globals.css` reflejan estos valores por defecto,
 * y Tailwind CSS está configurado para consumir las variables CSS.
 */

// TODO: reemplazar con colores oficiales de InTouchCX según su manual de marca corporativo
export const BRAND_CONFIG = {
  // Identidad de la empresa y aplicación
  companyName: "InTouchCX",
  appName: "SECURITY ARCADE",
  appSubtitle: "Protect operations in two decisions",
  eventTagline: "Security Awareness Week · InTouchCX",

  // Configuración de Logo
  logo: {
    // Si es null o vacío, el componente <BrandLogo /> muestra el recuadro placeholder "LOGO AQUÍ"
    url: null as string | null,
    // Logo SVG oficial incrustado si no hay URL externa subida
    useOfficialSvgFallback: true,
    placeholderText: "LOGO HERE",
    width: 170,
    height: 44,
  },

  // TODO: reemplazar con colores oficiales de InTouchCX
  // Paleta provisional neutra / corporativa con verde neón del prototipo
  colors: {
    primary: "#43E568",         // TODO: Verde primario oficial InTouchCX
    primaryHover: "#58F27B",    // TODO: Verde hover
    primaryMuted: "rgba(67, 229, 104, 0.15)",
    secondary: "#0D2E16",       // TODO: Color secundario institucional
    accent: "#FF5A65",          // TODO: Color de acento / peligro
    accentWarning: "#FBBF24",   // Color de alerta / advertencia
    bg: "#051B0B",              // TODO: Fondo principal oscuro
    bgLight: "#092612",         // Fondo secundario
    surface: "rgba(13, 46, 22, 0.82)", // Superficie tarjetas glassmorphism
    surfaceElevated: "rgba(20, 65, 33, 0.90)",
    border: "rgba(67, 229, 104, 0.22)",
    text: "#FFFFFF",
    textMuted: "#A3C6AD",
    success: "#43E568",
    danger: "#FF5A65",
  },

  // Medidas y estilos visuales
  radii: {
    sm: "0.5rem",   // 8px
    md: "0.75rem",  // 12px
    lg: "1rem",     // 16px
    xl: "1.5rem",   // 24px
    full: "9999px",
  },

  // Tipografías
  fonts: {
    sans: "Plus Jakarta Sans, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;

