import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, typography } from '../../config/theme';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly placeholder for empty lists — reads as polished in screenshots. */
export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  return (
    <View accessibilityRole="summary">
      <Card style={styles.card}>
        <View style={styles.container}>
          <View style={styles.iconHalo}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {actionLabel && onAction ? (
            <Button title={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
          ) : null}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    maxWidth: 520,
    alignSelf: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconHalo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    marginBottom: spacing.md,
  },
  icon: { fontSize: 40 },
  title: {
    ...typography.sectionTitle,
    fontSize: fontSize.lg,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  action: { marginTop: spacing.lg },
});
