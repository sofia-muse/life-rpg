import { CharacterAppearance } from '../types';

export const PAINTED_PORTRAITS = [
  {
    id: 'moonweaver',
    name: 'Moonweaver',
    description: 'A scholar of moonlight and ancient forests.',
    gender: 'female',
    source: require('../../assets/storybook/moonweaver.webp'),
  },
  {
    id: 'wildwood',
    name: 'Wildwood Guardian',
    description: 'A keeper of quiet courage and woodland paths.',
    gender: 'male',
    source: require('../../assets/storybook/wildwood.webp'),
  },
] as const;

export function getPaintedPortrait(appearance: CharacterAppearance) {
  return (
    PAINTED_PORTRAITS.find((portrait) => portrait.id === appearance.portraitId) ??
    PAINTED_PORTRAITS[appearance.gender === 'female' ? 0 : 1]
  );
}
