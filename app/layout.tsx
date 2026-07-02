import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Redox",
  description: "ATS-friendly resume builder with live preview and role-specific versions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-100">{children}</body>
    </html>
  );
}
