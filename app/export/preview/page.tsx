import { Suspense } from "react";
import ExportPreviewClient from "./ExportPreviewClient";

export default function ExportPreviewPage() {
  return (
    <Suspense
      fallback={<p className="p-6 text-sm text-gray-500">Loading preview…</p>}
    >
      <ExportPreviewClient />
    </Suspense>
  );
}
