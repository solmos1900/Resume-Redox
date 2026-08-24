import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ResetPasswordClient from "./ResetPasswordClient";

export default function AuthActionPage() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
            Loading…
          </div>
        }
      >
        <ResetPasswordClient />
      </Suspense>
    </AuthProvider>
  );
}
