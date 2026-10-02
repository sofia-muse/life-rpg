import { formatLastSeen, isMemberOnline, seedAppearance } from '../raidPresence';

describe('raid presence', () => {
  const now = Date.parse('2026-10-02T12:00:00Z');

  it('treats a recent log as online', () => {
    expect(isMemberOnline('2026-10-02T11:55:00Z', now)).toBe(true);
    expect(formatLastSeen('2026-10-02T11:55:00Z', now)).toBe('online');
  });

  it('describes older logs as last seen', () => {
    expect(isMemberOnline('2026-10-02T10:00:00Z', now)).toBe(false);
    expect(formatLastSeen('2026-10-02T10:00:00Z', now)).toBe('seen 2h ago');
  });

  it('seeds a stable appearance from a hero id', () => {
    expect(seedAppearance('hero-aria')).toEqual(seedAppearance('hero-aria'));
    expect(seedAppearance('hero-aria').gender === 'male' || seedAppearance('hero-aria').gender === 'female').toBe(
      true,
    );
  });
});
