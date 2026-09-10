/**
 * Login-scoped viewport helpers.
 * Restrictive maximum-scale stays on AuthGate/SignIn only — gallery/editor keep pinch-zoom.
 */

export const APP_VIEWPORT =
  "width=device-width, initial-scale=1, viewport-fit=cover";

/** Caps scale while on login to clear sticky iOS focus-zoom without app-wide a11y hit. */
export const LOGIN_VIEWPORT =
  "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover";

function setViewportContent(content: string) {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  meta.setAttribute("content", content);
}

/** Apply login-restricted viewport; toggle forces WebKit to re-apply scale. */
export function applyLoginViewport() {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  meta.setAttribute("content", `${LOGIN_VIEWPORT}, user-scalable=no`);
  requestAnimationFrame(() => {
    meta.setAttribute("content", LOGIN_VIEWPORT);
  });
}

/** Restore normal pinch-zoom after leaving SignIn / AuthGate. */
export function restoreAppViewport() {
  setViewportContent(APP_VIEWPORT);
}
