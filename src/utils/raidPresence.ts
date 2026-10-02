import {
  CharacterAppearance,
  ClassTier,
  HairColor,
  HairStyle,
  EyeStyle,
  GlassesStyle,
  MouthStyle,
  SkinTone,
  StatName,
  STAT_NAMES,
} from '../types';
import { RaidAvatarDto, RaidMemberDto } from '../api/raidApi';

const ONLINE_WINDOW_MS = 12 * 60 * 1000;

const HAIR_STYLES: HairStyle[] = ['short', 'medium', 'long', 'shaved'];
const EYE_STYLES: EyeStyle[] = ['circle', 'oval', 'smile'];
const MOUTH_STYLES: MouthStyle[] = ['laugh', 'smile', 'peace'];
const GLASSES: GlassesStyle[] = ['none', 'round', 'square'];

export function isMemberOnline(lastSeenAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastSeenAt) return false;
  const seen = Date.parse(lastSeenAt);
  if (Number.isNaN(seen)) return false;
  return now - seen >= 0 && now - seen < ONLINE_WINDOW_MS;
}

export function formatLastSeen(lastSeenAt: string | null | undefined, now = Date.now()): string {
  if (!lastSeenAt) return 'in the party';
  if (isMemberOnline(lastSeenAt, now)) return 'online';
  const seen = Date.parse(lastSeenAt);
  if (Number.isNaN(seen)) return 'in the party';
  const mins = Math.max(1, Math.round((now - seen) / 60000));
  if (mins < 60) return `seen ${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `seen ${hours}h ago`;
  return 'away';
}

function hash(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) {
    value = (value * 33 + seed.charCodeAt(i)) >>> 0;
  }
  return value;
}

function pick<T>(items: readonly T[], seed: number, salt: number): T {
  return items[(seed + salt) % items.length] as T;
}

export function seedAppearance(seed: string): CharacterAppearance {
  const n = hash(seed || 'hero');
  return {
    gender: n % 2 === 0 ? 'male' : 'female',
    skinTone: (n % 6) as SkinTone,
    hairStyle: pick(HAIR_STYLES, n, 3),
    hairColor: (n % 5) as HairColor,
    eyeStyle: pick(EYE_STYLES, n, 5),
    mouthStyle: pick(MOUTH_STYLES, n, 7),
    glassesStyle: pick(GLASSES, n, 11),
  };
}

function asStat(value: string | undefined): StatName {
  return STAT_NAMES.includes(value as StatName) ? (value as StatName) : 'strength';
}

function asTier(value: number | undefined): ClassTier {
  if (value === 2 || value === 3 || value === 4 || value === 5) return value;
  return 1;
}

export function memberAppearance(member: RaidMemberDto): {
  appearance: CharacterAppearance;
  stat: StatName;
  tier: ClassTier;
} {
  const avatar: RaidAvatarDto | null | undefined = member.avatar;
  if (!avatar) {
    return { appearance: seedAppearance(member.heroId || member.heroName), stat: 'strength', tier: 1 };
  }
  const seeded = seedAppearance(member.heroId);
  return {
    appearance: {
      gender: avatar.gender === 'female' ? 'female' : 'male',
      skinTone: (Math.max(0, Math.min(5, avatar.skinTone)) || 0) as SkinTone,
      hairStyle: HAIR_STYLES.includes(avatar.hairStyle as HairStyle)
        ? (avatar.hairStyle as HairStyle)
        : seeded.hairStyle,
      hairColor: (Math.max(0, Math.min(4, avatar.hairColor)) || 0) as HairColor,
      eyeStyle: EYE_STYLES.includes(avatar.eyeStyle as EyeStyle)
        ? (avatar.eyeStyle as EyeStyle)
        : seeded.eyeStyle,
      mouthStyle: MOUTH_STYLES.includes(avatar.mouthStyle as MouthStyle)
        ? (avatar.mouthStyle as MouthStyle)
        : seeded.mouthStyle,
      glassesStyle: GLASSES.includes(avatar.glassesStyle as GlassesStyle)
        ? (avatar.glassesStyle as GlassesStyle)
        : 'none',
    },
    stat: asStat(avatar.dominantStat),
    tier: asTier(avatar.classTier),
  };
}
