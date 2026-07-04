import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, fontSize, radius, spacing, typography } from '../../config/theme';

interface Props {
  icon: string;
  title: string;
  subtitle: string;
  accentColor?: string;
  onPress: () => void;
}

export function SanctuaryActionTile({
  icon,
  title,
  subtitle,
  accentColor = colors.gold,
  onPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.iconWrap, { borderColor: `${accentColor}55`, backgroundColor: `${accentColor}12` }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 150,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(15, 15, 26, 0.55)',
    padding: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 18,
    ...typography.body,
  },
});
