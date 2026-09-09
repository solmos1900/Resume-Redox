import { Fragment, type ReactNode } from "react";
import type { ReorderableSectionId } from "@/lib/schema";
import { normalizeSectionOrder } from "@/lib/templates/section-order";

/**
 * Render body sections in shared export/preview order.
 * Contact stays outside this list (pinned at top).
 */
export function OrderedBodySections({
  order,
  sections,
}: {
  order?: readonly ReorderableSectionId[] | null;
  sections: Partial<Record<ReorderableSectionId, ReactNode>>;
}) {
  return (
    <>
      {normalizeSectionOrder(order).map((id) => {
        const node = sections[id];
        if (!node) return null;
        return <Fragment key={id}>{node}</Fragment>;
      })}
    </>
  );
}
