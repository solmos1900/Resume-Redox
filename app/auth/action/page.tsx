import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ResetPasswordClient from "./ResetPasswordClient";

export default function AuthActionPage() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center bg-paper-deep text-ink-muted text-sm">
            Loading…
          </div>
        }
      >
        <ResetPasswordClient />
      </Suspense>
    </AuthProvider>
  );
}
