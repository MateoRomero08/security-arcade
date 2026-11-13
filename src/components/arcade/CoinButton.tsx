"use client";

import React from "react";
import { synth } from "@/lib/audio/synth";

interface CoinButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "allow" | "infraction" | "subtle";
  icon?: React.ReactNode;
  pulse?: boolean;
}

export const CoinButton: React.FC<CoinButtonProps> = ({
  children,
  variant = "primary",
  icon,
  pulse = false,
  className = "",
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    synth.playCoin();
    if (onClick) onClick(e);
  };

  let variantStyles = "btn-icx-primary";
  if (variant === "allow") variantStyles = "btn-allow";
  if (variant === "infraction") variantStyles = "btn-infraction";
  if (variant === "subtle") {
    variantStyles = "icx-subcard text-white hover:border-brand-primary/60";
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`btn-interactive ${variantStyles} ${
        pulse ? "animate-pulse-glow" : ""
      } flex items-center justify-center gap-2 select-none font-extrabold transition-all duration-200 active:scale-95 ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default CoinButton;

