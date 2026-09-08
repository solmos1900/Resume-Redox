/**
 * Entry for esbuild → CJS bundle used by the PDF API.
 * Loaded via absolute file URL so Next/webpack does not analyze react-dom/server.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumeTemplateSwitch } from "../../components/preview/templates/ResumeTemplateSwitch";
import type { ResumeVersion, TemplateId } from "../schema";
import { toResumeContent } from "../templates/types";
import { EXPORT_RESUME_CSS } from "./generated/export-resume-css";

export function buildResumeExportHtml(version: ResumeVersion): string {
  const data = toResumeContent(version);
  const templateId = (version.templateId ?? "classic") as TemplateId;
  const body = renderToStaticMarkup(
    createElement(ResumeTemplateSwitch, { templateId, data })
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(version.name || "Resume")}</title>
  <style>${EXPORT_RESUME_CSS}</style>
</head>
<body>
  <div id="resume-export-root" class="resume-export-root">
    ${body}
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
