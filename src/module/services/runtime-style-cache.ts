/**
 * Runtime stylesheet cache-busting for Foundry reload cycles.
 *
 * Why this exists:
 * - Foundry can serve stale CSS between world refreshes during development.
 * - We keep module.json canonical and force CSS freshness at runtime instead.

 */

const STYLE_MARKER_ATTR = 'data-wfrp4e-species-builder-style';

function buildCacheBustedStyleHref(moduleId: string, stylesheetPath: string): string {
  const relativePath = `modules/${moduleId}/${stylesheetPath}`;
  const getRoute = foundry?.utils?.getRoute as ((path: string) => string) | undefined;
  const basePath = getRoute ? getRoute(relativePath) : `/${relativePath}`;
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}cb=${Date.now()}`;
}

/**
 * Ensure module stylesheet is present in document head and refreshed with
 * a per-reload cache token.
 */
export function ensureFreshModuleStyles(moduleId: string, stylesheetPath = 'dist/app.css'): void {
  const existing = document.head.querySelector(
    `link[${STYLE_MARKER_ATTR}]`,
  ) as HTMLLinkElement | null;
  const link = existing ?? document.createElement('link');

  if (!existing) {
    link.rel = 'stylesheet';
    link.setAttribute(STYLE_MARKER_ATTR, 'true');
    document.head.append(link);
  }

  link.href = buildCacheBustedStyleHref(moduleId, stylesheetPath);
}
