import { ReactNode, ReactElement, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
  fallback: ReactElement | null;
}

const AuthGuard = (props: AuthGuardProps) => {
  const { children, fallback } = props;
  const auth = useAuth();
  const router = useRouter();
  // We no longer need pathname for redirect logic since we react to auth state.

  useEffect(() => {
    if (!router) return;
    // Redirect only after we know loading finished and user is still null (unauthenticated)
    if (!auth.isLoading && auth.user === null) {
      router.replace("/login");
      router.refresh();
    }
  }, [auth.isLoading, auth.user, router]);

  return (
    <div className="relative">
      {children}
      {auth.isLoading && (
        <div className="fixed min-h-screen inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10 dark:bg-black/10">
          {fallback}
        </div>
      )}
    </div>
  );
};

export default AuthGuard;