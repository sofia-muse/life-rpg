import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Card } from '../layout/Card';
import { colors, spacing, fontSize, typography } from '../../config/theme';
import { getDailyMentorQuote } from '../../config/npcMentors';
import { StatName } from '../../types';

interface Props {
  dominantStat: StatName;
}

export function MentorQuote({ dominantStat }: Props) {
  const { mentor, quote } = getDailyMentorQuote(dominantStat);

  return (
    <Card style={styles.card}>
      <Text style={styles.overline}>Word from the Realm</Text>
      <Text style={styles.quote}>&ldquo;{quote}&rdquo;</Text>
      <Text style={styles.attribution}>
        — {mentor.name}, {mentor.title}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  overline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    ...typography.headingWide,
  },
  quote: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontStyle: 'italic',
    lineHeight: 22,
    ...typography.journal,
  },
  attribution: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    fontWeight: '600',
    ...typography.body,
  },
});
