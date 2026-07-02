"use client";

import { TEMPLATE_CATALOG } from "@/lib/templates/catalog";
import type { TemplateId } from "@/lib/templates/types";
import { useResumeStore } from "@/lib/store";

export function TemplatePicker() {
  const version = useResumeStore((s) => s.getActiveVersion());
  const updateActiveVersion = useResumeStore((s) => s.updateActiveVersion);

  if (!version) return null;

  const activeId = (version.templateId ?? "classic") as TemplateId;

  return (
    <div className="no-print border-b border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-600 mb-2">
        Template — all options are ATS-safe (single column, semantic HTML, system fonts)
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEMPLATE_CATALOG.map((template) => {
          const selected = activeId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() =>
                updateActiveVersion({ templateId: template.id })
              }
              className={`shrink-0 text-left rounded-lg border px-3 py-2 min-w-[140px] transition-colors ${
                selected
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-gray-50 hover:border-gray-400 text-gray-800"
              }`}
            >
              <span className="block text-xs font-semibold">{template.name}</span>
              <span
                className={`block text-[10px] mt-0.5 ${
                  selected ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {template.tagline}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TemplateCatalogInfo() {
  const version = useResumeStore((s) => s.getActiveVersion());
  if (!version) return null;

  const activeId = (version.templateId ?? "classic") as TemplateId;
  const template = TEMPLATE_CATALOG.find((t) => t.id === activeId);

  if (!template) return null;

  return (
    <div className="no-print mx-6 mb-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
      <span className="font-medium text-gray-800">{template.name}:</span>{" "}
      {template.description}
    </div>
  );
}
