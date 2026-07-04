import {
  getContentMaxWidth,
  getScreenHorizontalPadding,
  getScreenTopPadding,
  getTabDockWidth,
  getViewportSize,
} from '../responsive';

describe('responsive layout helpers', () => {
  it('classifies phone, tablet, and desktop breakpoints', () => {
    expect(getViewportSize(390)).toBe('phone');
    expect(getViewportSize(768)).toBe('tablet');
    expect(getViewportSize(1440)).toBe('desktop');
  });

  it('keeps phone layouts fluid and widens tablet or desktop content intentionally', () => {
    expect(getContentMaxWidth(390, 'wide')).toBeUndefined();
    expect(getContentMaxWidth(900, 'regular')).toBe(860);
    expect(getContentMaxWidth(1366, 'wide')).toBe(1280);
    expect(getContentMaxWidth(1366, 'full')).toBeUndefined();
  });

  it('scales shared padding and dock sizing by viewport', () => {
    expect(getScreenHorizontalPadding(390)).toBe(16);
    expect(getScreenHorizontalPadding(900)).toBe(24);
    expect(getScreenHorizontalPadding(1440)).toBe(32);

    expect(getScreenTopPadding(390, true)).toBe(16);
    expect(getScreenTopPadding(900, true)).toBe(24);
    expect(getScreenTopPadding(900, false)).toBe(48);

    expect(getTabDockWidth(390)).toBe(366);
    expect(getTabDockWidth(900)).toBe(760);
    expect(getTabDockWidth(1440)).toBe(980);
  });
});
