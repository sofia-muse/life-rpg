import { CAMPAIGN_CHAPTERS, isChapterLocked } from '../campaignChapters';

describe('isChapterLocked', () => {
  const iron = CAMPAIGN_CHAPTERS[0];
  const banner = CAMPAIGN_CHAPTERS.find((chapter) => chapter.id === 'banner_rising');

  it('keeps the hero dominant-stat chapter open', () => {
    expect(iron).toBeDefined();
    expect(isChapterLocked(iron, 1, 'strength')).toBe(false);
  });

  it('shrouds other chapters until the hero level threshold', () => {
    expect(banner).toBeDefined();
    if (!banner) return;
    expect(isChapterLocked(banner, 4, 'strength')).toBe(true);
    expect(isChapterLocked(banner, banner.minHeroLevel, 'strength')).toBe(false);
    expect(isChapterLocked(banner, 1, 'charisma')).toBe(false);
  });
});
