import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { breakpoints, layout } from '../config/theme';

type ContentWidth = 'compact' | 'regular' | 'wide' | 'full';

const CONTENT_WIDTHS: Record<Exclude<ContentWidth, 'full'>, number> = {
  compact: layout.compactWidth,
  regular: layout.regularWidth,
  wide: layout.wideWidth,
};

export function resolveContentWidth(size: ContentWidth) {
  if (size === 'full') return undefined;
  return CONTENT_WIDTHS[size];
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= breakpoints.tablet;
    const isDesktop = width >= breakpoints.desktop;
    const horizontalPadding = isDesktop
      ? layout.gutterDesktop
      : isTablet
        ? layout.gutterTablet
        : layout.gutterPhone;

    return {
      width,
      height,
      isTablet,
      isDesktop,
      isPhone: !isTablet,
      horizontalPadding,
      gridColumns: isDesktop ? 2 : 1,
    };
  }, [height, width]);
}
