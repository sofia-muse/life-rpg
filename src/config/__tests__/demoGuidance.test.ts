import { getDemoQuestSuggestionPack } from '../demoGuidance';

describe('getDemoQuestSuggestionPack', () => {
  it('returns daily and side suggestions for the dominant stat', () => {
    const pack = getDemoQuestSuggestionPack('intelligence');

    expect(pack.contractTitle).toMatch(/Intelligence/i);
    expect(pack.suggestions.length).toBeGreaterThanOrEqual(3);
    expect(pack.suggestions.every((s) => s.stat === 'intelligence')).toBe(true);
    expect(pack.suggestions[0]?.whyItFits.length).toBeGreaterThan(0);
  });
});
