import React from "react";

export type AuthSpinnerProps = {
  /** Predefined sizes or explicit pixel number */
  size?: "sm" | "md" | "lg" | number;
  /** Optional accessible loading label (visually shown). */
  label?: string;
  /** Extra Tailwind / custom classes */
  className?: string;
  /** Hide the textual label visually but keep for screen readers */
  srOnlyLabel?: boolean;
};

const sizeToPx = (size: AuthSpinnerProps["size"]) => {
  if (typeof size === "number") return size;
  switch (size) {
    case "sm":
      return 20;
    case "lg":
      return 48;
    case "md":
    default:
      return 32;
  }
};

/**
 * AuthSpinner – lightweight, accessible loading indicator.
 * Usage: <AuthSpinner /> or <AuthSpinner size="lg" label="Authenticating" />
 */
const AuthSpinner: React.FC<AuthSpinnerProps> = ({
  size = "md",
  label = "Loading...",
  className = "",
  srOnlyLabel = false,
}) => {
  const px = sizeToPx(size);
  // Tailwind won't generate dynamic arbitrary classes created at runtime; use inline style instead
  const dimensionStyle: React.CSSProperties = { width: px, height: px };

  return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-6 h-6 border border-orange-400 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-xs font-light">
            {label}
          </p>
        </div>
      </div>
  );
};

export default AuthSpinner;
