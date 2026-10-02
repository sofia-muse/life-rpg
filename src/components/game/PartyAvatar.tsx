import React from 'react';
import { StyleSheet, View } from 'react-native';
import Avatar from '@zamplyy/react-native-nice-avatar';
import { RaidMemberDto } from '../../api/raidApi';
import { buildNiceAvatarConfig } from '../../config/anime/niceAvatarConfig';
import { colors } from '../../config/theme';
import { formatLastSeen, isMemberOnline, memberAppearance } from '../../utils/raidPresence';

interface Props {
  member: RaidMemberDto;
  size?: number;
}

export function PartyAvatar({ member, size = 36 }: Props) {
  const { appearance, stat, tier } = memberAppearance(member);
  const config = buildNiceAvatarConfig(appearance, stat, tier, 'neutral');
  const online = isMemberOnline(member.lastSeenAt);

  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityLabel={formatLastSeen(member.lastSeenAt)}>
      <Avatar size={size} shape="circle" {...config} />
      <View style={[styles.dot, online ? styles.online : styles.away]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: 8,
  },
  dot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.bgPrimary,
  },
  online: {
    backgroundColor: colors.success,
  },
  away: {
    backgroundColor: colors.textMuted,
  },
});
