"use client";

import type {
  AiRecommendationSection,
  AiRecommendationType,
} from "@/lib/schema";

type Props = {
  typeFilter: AiRecommendationType | "all";
  sectionFilter: AiRecommendationSection | "all";
  onTypeChange: (type: AiRecommendationType | "all") => void;
  onSectionChange: (section: AiRecommendationSection | "all") => void;
};

const TYPE_OPTIONS: { value: AiRecommendationType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "roast", label: "Roast" },
  { value: "spell", label: "Spelling" },
  { value: "tailor", label: "Tailor" },
  { value: "general", label: "Tips" },
];

const SECTION_OPTIONS: {
  value: AiRecommendationSection | "all";
  label: string;
}[] = [
  { value: "all", label: "All sections" },
  { value: "summary", label: "Summary" },
  { value: "experience", label: "Experience" },
  { value: "skills", label: "Skills" },
  { value: "education", label: "Education" },
  { value: "contact", label: "Contact" },
  { value: "overall", label: "Overall" },
];

export function AiCoachFilters({
  typeFilter,
  sectionFilter,
  onTypeChange,
  onSectionChange,
}: Props) {
  return (
    <div className="space-y-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div className="flex flex-wrap gap-1">
        {TYPE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onTypeChange(value)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              typeFilter === value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <select
        value={sectionFilter}
        onChange={(e) =>
          onSectionChange(e.target.value as AiRecommendationSection | "all")
        }
        className="text-xs border rounded px-2 py-1.5 bg-white w-full"
      >
        {SECTION_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
