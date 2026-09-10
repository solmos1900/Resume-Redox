import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Redox",
  description: "ATS-friendly resume builder with live preview and role-specific versions",
};

/** App-wide: allow pinch-zoom. Login-only maximum-scale is applied in AuthGate/SignIn. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full max-w-full overflow-x-hidden">
      <body className="h-full max-w-full overflow-x-hidden antialiased bg-gray-100">
        {children}
      </body>
    </html>
  );
}
