import React, { ReactNode } from "react";
import AuthSpinner from "@/components/common/AuthSpinner";
import AuthGuard from "./auth-guard";

type GuardProps = {
  /** Indicates the current route requires authentication */
  authGuard: boolean;
  children: ReactNode;
};
export const AUTH_ROUTES: string[] = ["/dashboard", "/receipt"];

export const getProperAuthGuardType = (path: string) => {
  if (path.startsWith("/p/")) return true;
  return AUTH_ROUTES.some((route) => path.startsWith(route));
};

const GuardProvider = ({ children, authGuard }: GuardProps) => {
  // If the route is protected, wrap it in AuthGuard with a spinner fallback
  if (authGuard) {
    return (
      <AuthGuard fallback={<AuthSpinner label="Checking authentication..." />}> 
        {children}
      </AuthGuard>
    );
  }

  // Public route — just render children
  return <>{children}</>;
};

export default GuardProvider;