"use client";

import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { SignInScreen } from "./SignInScreen";

/** Blocks access to the app entirely until the user is signed in. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, initializing, configured } = useAuth();

  if (!configured) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md text-center text-sm text-gray-500">
          <p className="font-semibold text-gray-700 mb-1">
            Sign-in isn&apos;t configured yet
          </p>
          <p>
            This deployment is missing its Firebase config
            (NEXT_PUBLIC_FIREBASE_*), so no one can sign in yet. Add it to
            the environment and redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
        Loading account…
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return <>{children}</>;
}
