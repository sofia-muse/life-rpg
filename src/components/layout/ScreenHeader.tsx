import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, typography } from '../../config/theme';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function ScreenHeader({ eyebrow, title, subtitle, action }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    ...typography.body,
  },
  action: {
    flexShrink: 0,
  },
});
