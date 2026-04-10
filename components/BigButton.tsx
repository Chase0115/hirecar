"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function BigButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: BigButtonProps) {
  return (
    <button
      className={`big-button big-button--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
