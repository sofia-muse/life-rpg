import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from '../layout/Card';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import { guidanceApi, QuestSuggestionPackDto } from '../../api/guidanceApi';
import { STAT_COLORS, STAT_ICONS, DIFFICULTY_XP, StatName } from '../../types';
import { env } from '../../config/env';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useHeroStore } from '../../store/heroStore';
import { QuestTemplate } from '../../config/questTemplates';
import { getDemoQuestSuggestionPack } from '../../config/demoGuidance';

interface Props {
  onAddQuest: (template: QuestTemplate) => void;
  existingTitles: Set<string>;
}

export function GuildmasterSuggestions({ onAddQuest, existingTitles }: Props) {
  const [livePack, setLivePack] = useState<QuestSuggestionPackDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(env.demoMode);
  const aiSkillsEnabled = useSettingsStore((s) => s.aiSkillsEnabled);
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const dominantStat = useHeroStore((s) => s.hero?.dominantStat ?? ('strength' as StatName));
  const canUseGuidance = aiSkillsEnabled && !env.demoMode && authenticated;

  const demoPack = useMemo(
    () => (env.demoMode ? getDemoQuestSuggestionPack(dominantStat) : null),
    [dominantStat],
  );

  const pack = canUseGuidance ? livePack : demoPack;

  const loadSuggestions = () => {
    setLoading(true);
    setError(null);
    void guidanceApi
      .getQuestSuggestions()
      .then(setLivePack)
      .catch((err) => setError(err instanceof Error ? err.message : 'Suggestions unavailable'))
      .finally(() => setLoading(false));
  };

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && canUseGuidance && !livePack && !loading) {
      loadSuggestions();
    }
  };

  if (!canUseGuidance && !env.demoMode) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>The Guildmaster</Text>
        <Text style={styles.offline}>
          Sign in with AI guidance enabled to receive personalized quest recommendations.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={toggleExpanded} style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {expanded ? '▼' : '▶'} The Guildmaster Recommends
          </Text>
          {env.demoMode ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Demo guidance</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {loading && <ActivityIndicator color={colors.gold} />}
          {error && <Text style={styles.error}>{error}</Text>}
          {pack && (
            <>
              <Text style={styles.contract}>{pack.contractTitle}</Text>
              {pack.suggestions
                .filter((s) => !existingTitles.has(s.title))
                .slice(0, 4)
                .map((suggestion) => (
                  <View key={suggestion.title} style={styles.suggestion}>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionTitle}>
                        {STAT_ICONS[suggestion.stat]} {suggestion.title}
                      </Text>
                      <Text style={styles.suggestionWhy} numberOfLines={2}>
                        {suggestion.whyItFits}
                      </Text>
                      <Text style={[styles.suggestionMeta, { color: STAT_COLORS[suggestion.stat] }]}>
                        {suggestion.difficulty} · {DIFFICULTY_XP[suggestion.difficulty]} XP
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() =>
                        onAddQuest({
                          title: suggestion.title,
                          description: suggestion.description,
                          type: suggestion.type,
                          difficulty: suggestion.difficulty,
                          stat: suggestion.stat,
                          totalSteps: suggestion.totalSteps ?? undefined,
                        })
                      }
                    >
                      <Text style={styles.addBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { marginBottom: spacing.xs },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: `${colors.gold}22`,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.gold,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  offline: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  body: { gap: spacing.sm },
  contract: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  error: { color: colors.error, fontSize: fontSize.sm },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgInset,
    gap: spacing.sm,
  },
  suggestionInfo: { flex: 1 },
  suggestionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  suggestionWhy: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  suggestionMeta: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: colors.bgPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
