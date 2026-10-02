import { playSfx } from '../sfx';

describe('playSfx', () => {
  it('does not throw when Web Audio is missing', () => {
    expect(() => playSfx('click')).not.toThrow();
    expect(() => playSfx('questComplete')).not.toThrow();
    expect(() => playSfx('levelUp')).not.toThrow();
    expect(() => playSfx('bossHit')).not.toThrow();
    expect(() => playSfx('raidEnter')).not.toThrow();
  });
});
