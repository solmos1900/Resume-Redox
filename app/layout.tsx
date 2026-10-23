import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";

const SITE_DESCRIPTION =
  "A free resume builder that doesn't hold your PDF hostage. Unlimited resumes, ATS-friendly templates, and PDF/Word downloads — no paywall, no watermark. Optional AI tailoring, proofreading, and job alerts with Redox Pro.";

export const metadata: Metadata = {
  title: {
    default: "Resume Redox — the free resume builder, for real",
    template: "%s · Resume Redox",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Resume Redox",
  openGraph: {
    title: "Resume Redox — the free resume builder, for real",
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: "Resume Redox",
  },
  twitter: {
    card: "summary",
    title: "Resume Redox — the free resume builder, for real",
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: "/icon.svg",
  },
};

/** App-wide: allow pinch-zoom. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F3EE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full max-w-full overflow-x-hidden">
      <body className="h-full max-w-full overflow-x-hidden bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
