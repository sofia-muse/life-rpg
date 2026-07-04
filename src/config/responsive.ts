export const breakpoints = {
  tablet: 768,
  desktop: 1200,
} as const;

export type ViewportSize = 'phone' | 'tablet' | 'desktop';
export type ContentWidth = 'compact' | 'regular' | 'wide' | 'full';

export function getViewportSize(width: number): ViewportSize {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'phone';
}

export function getScreenHorizontalPadding(width: number): number {
  if (width >= breakpoints.desktop) return 32;
  if (width >= breakpoints.tablet) return 24;
  return 16;
}

export function getScreenTopPadding(width: number, isWeb: boolean): number {
  if (!isWeb) return 48;
  if (width >= breakpoints.desktop) return 32;
  if (width >= breakpoints.tablet) return 24;
  return 16;
}

export function getContentMaxWidth(width: number, contentWidth: ContentWidth = 'wide'): number | undefined {
  if (contentWidth === 'full') return undefined;

  const viewport = getViewportSize(width);
  if (viewport === 'phone') return undefined;

  const widths = {
    compact: { tablet: 680, desktop: 760 },
    regular: { tablet: 860, desktop: 980 },
    wide: { tablet: 1040, desktop: 1280 },
  } as const;

  return widths[contentWidth][viewport];
}

export function getTabDockWidth(width: number): number {
  if (width >= breakpoints.desktop) return Math.min(width - 64, 980);
  if (width >= breakpoints.tablet) return Math.min(width - 48, 760);
  return Math.max(width - 24, 0);
}
