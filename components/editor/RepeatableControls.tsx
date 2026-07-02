"use client";

type Props = {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

export function RepeatableControls({
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
}: Props) {
  return (
    <div className="flex gap-1">
      {onMoveUp && (
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50"
          title="Move up"
        >
          ↑
        </button>
      )}
      {onMoveDown && (
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50"
          title="Move down"
        >
          ↓
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  );
}
