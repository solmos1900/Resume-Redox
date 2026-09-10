import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Redox",
  description: "ATS-friendly resume builder with live preview and role-specific versions",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do not set maximumScale — keeps pinch-zoom available for a11y.
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="max-w-full overflow-x-hidden">
      <body className="antialiased bg-gray-100 max-w-full overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
