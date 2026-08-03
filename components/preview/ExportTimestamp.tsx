import { formatExportTimestamp } from "@/lib/export";

type Props = {
  exportedAt: string;
};

export function ExportTimestamp({ exportedAt }: Props) {
  const date = new Date(exportedAt);
  if (Number.isNaN(date.getTime())) return null;

  return (
    <p className="export-timestamp" aria-label="Export timestamp">
      Saved {formatExportTimestamp(date)}
    </p>
  );
}
