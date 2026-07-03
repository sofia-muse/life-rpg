import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/layout/Button';
import { Card } from '../src/components/layout/Card';
import { useHeroStore } from '../src/store/heroStore';
import { useQuestStore } from '../src/store/questStore';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';
import {
  Gender,
  SkinTone,
  HairStyle,
  HairColor,
  CharacterAppearance,
  STAT_NAMES,
  STAT_COLORS,
  STAT_ICONS,
  DIFFICULTY_XP,
} from '../src/types';
import { QUIZ_QUESTIONS, calculateQuizResults, QuizResult } from '../src/config/quiz';
import { pickRandomTemplates } from '../src/config/questTemplates';
import { getStarterQuests } from '../src/config/classes';
import { NiceAvatarCharacter } from '../src/components/avatar/NiceAvatarCharacter';
import { SKIN_TONE_COLORS, HAIR_COLOR_VALUES } from '../src/config/appearanceConfig';

type Step = 'welcome' | 'name' | 'character' | 'quiz' | 'results' | 'starter' | 'begin';

export default function OnboardingScreen() {
  const router = useRouter();
  const { createHero } = useHeroStore();
  const { addQuest } = useQuestStore();

  const [step, setStep] = useState<Step>('welcome');
  const [heroName, setHeroName] = useState('');
  const [charAppearance, setCharAppearance] = useState<CharacterAppearance>({
    gender: 'male',
    skinTone: 2 as SkinTone,
    hairStyle: 'short',
    hairColor: 1 as HairColor,
    eyeStyle: 'oval',
    mouthStyle: 'smile',
    glassesStyle: 'none',
  });
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...quizAnswers, answerIndex];
    setQuizAnswers(newAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const result = calculateQuizResults(newAnswers);
      setQuizResult(result);
      setStep('results');
    }
  };

  const handleComplete = () => {
    const focusStats = quizResult?.topStats ?? ['strength', 'vitality', 'willpower'];
    const seed = `${heroName}-${Date.now()}`;
    createHero(heroName.trim() || 'Hero', seed, focusStats, charAppearance);

    // Add starter daily quests
    const starters = getStarterQuests(focusStats, charAppearance.gender);
    for (const q of starters) {
      addQuest({
        title: q.title,
        description: q.description,
        type: 'daily',
        difficulty: 'easy',
        stat: q.stat,
        xpReward: DIFFICULTY_XP.easy,
        isActive: true,
      });
    }

    // Add a starter side quest for each focus stat
    for (const stat of focusStats) {
      const sides = pickRandomTemplates('side', stat, 1, charAppearance.gender);
      for (const q of sides) {
        addQuest({
          title: q.title,
          description: q.description,
          type: 'side',
          difficulty: q.difficulty,
          stat: q.stat,
          xpReward: DIFFICULTY_XP[q.difficulty],
          isActive: true,
        });
      }
    }

    // Add one boss quest for the dominant stat
    const dominant = focusStats[0];
    const bosses = pickRandomTemplates('boss', dominant, 1, charAppearance.gender);
    for (const q of bosses) {
      addQuest({
        title: q.title,
        description: q.description,
        type: 'boss',
        difficulty: q.difficulty,
        stat: q.stat,
        xpReward: DIFFICULTY_XP[q.difficulty],
        isActive: true,
        totalSteps: q.totalSteps,
        completedSteps: 0,
      });
    }

    router.replace('/');
  };

  const question = QUIZ_QUESTIONS[currentQuestion];
  const totalSteps = ['welcome', 'name', 'character', 'quiz', 'results', 'starter', 'begin'];
  const progressIndex = step === 'quiz' ? 3 : totalSteps.indexOf(step);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 'welcome' && (
          <View style={styles.step}>
            <Text style={styles.bigIcon}>⚔️</Text>
            <Text style={styles.heading}>Welcome, Adventurer</Text>
            <Text style={styles.body}>
              Your real life can become a gentler kind of quest.{'\n\n'}
              Build small rituals. Earn XP. Let everyday acts of care shape your legend.
            </Text>
            <Button title="Begin Your Journey" onPress={() => setStep('name')} />
          </View>
        )}

        {step === 'name' && (
          <View style={styles.step}>
            <Text style={styles.bigIcon}>🏰</Text>
            <Text style={styles.heading}>Name Your Hero</Text>
            <Text style={styles.body}>What name will your journey answer to?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name..."
              placeholderTextColor={colors.textMuted}
              value={heroName}
              onChangeText={setHeroName}
              maxLength={20}
              autoFocus
            />
            <Button
              title="Next"
              onPress={() => setStep('character')}
              disabled={heroName.trim().length === 0}
            />
          </View>
        )}

        {step === 'character' && (
          <View style={styles.step}>
            <Text style={styles.heading}>Shape Your Hero</Text>
            <View style={styles.charPreview}>
              <NiceAvatarCharacter
                appearance={charAppearance}
                dominantStat="strength"
                classTier={1}
                size={120}
              />
            </View>

            <Text style={styles.charLabel}>Gender</Text>
            <View style={styles.charRow}>
              {(['male', 'female'] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.charOption,
                    charAppearance.gender === g && styles.charOptionActive,
                  ]}
                  onPress={() => setCharAppearance((prev) => ({ ...prev, gender: g }))}
                >
                  <Text style={styles.charOptionText}>{g === 'male' ? '♂ Male' : '♀ Female'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.charLabel}>Skin Tone</Text>
            <View style={styles.charRow}>
              {([0, 1, 2, 3, 4, 5] as SkinTone[]).map((tone) => (
                <TouchableOpacity
                  key={tone}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: SKIN_TONE_COLORS[tone] },
                    charAppearance.skinTone === tone && styles.swatchActive,
                  ]}
                  onPress={() => setCharAppearance((prev) => ({ ...prev, skinTone: tone }))}
                />
              ))}
            </View>

            <Text style={styles.charLabel}>Hair Style</Text>
            <View style={styles.charRow}>
              {(['short', 'medium', 'long', 'shaved'] as HairStyle[]).map((hs) => (
                <TouchableOpacity
                  key={hs}
                  style={[
                    styles.charOption,
                    charAppearance.hairStyle === hs && styles.charOptionActive,
                  ]}
                  onPress={() => setCharAppearance((prev) => ({ ...prev, hairStyle: hs }))}
                >
                  <Text style={styles.charOptionText}>
                    {hs.charAt(0).toUpperCase() + hs.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.charLabel}>Hair Color</Text>
            <View style={styles.charRow}>
              {([0, 1, 2, 3, 4] as HairColor[]).map((hc) => (
                <TouchableOpacity
                  key={hc}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: HAIR_COLOR_VALUES[hc] },
                    charAppearance.hairColor === hc && styles.swatchActive,
                  ]}
                  onPress={() => setCharAppearance((prev) => ({ ...prev, hairColor: hc }))}
                />
              ))}
            </View>

            <Button
              title="Next"
              onPress={() => {
                setCurrentQuestion(0);
                setQuizAnswers([]);
                setStep('quiz');
              }}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}

        {step === 'quiz' && question && (
          <View style={styles.step}>
            <Text style={styles.quizProgress}>
              Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.heading}>{question.scenario}</Text>
            <View style={styles.answerList}>
              {question.answers.map((answer, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.answerCard}
                  onPress={() => handleQuizAnswer(i)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.answerText}>{answer.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 'results' && quizResult && (
          <View style={styles.step}>
            <Text style={styles.bigIcon}>🔮</Text>
            <Text style={styles.heading}>Your Adventurer Profile</Text>
            <Text style={styles.body}>
              Based on your answers, these are the gifts that shine brightest right now:
            </Text>

            {/* Top 3 stats */}
            <View style={styles.resultStats}>
              {quizResult.topStats.map((stat, i) => {
                const maxScore = Math.max(...Object.values(quizResult.scores));
                const pct = maxScore > 0 ? (quizResult.scores[stat] / maxScore) * 100 : 0;
                return (
                  <View key={stat} style={styles.resultStatRow}>
                    <View style={styles.resultStatHeader}>
                      <Text style={styles.resultRank}>#{i + 1}</Text>
                      <Text style={styles.resultStatIcon}>{STAT_ICONS[stat]}</Text>
                      <Text style={[styles.resultStatName, { color: STAT_COLORS[stat] }]}>
                        {stat.charAt(0).toUpperCase() + stat.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.resultBar}>
                      <View
                        style={[
                          styles.resultBarFill,
                          { width: `${pct}%`, backgroundColor: STAT_COLORS[stat] },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* All scores */}
            <View style={styles.allScores}>
              {STAT_NAMES.map((stat) => (
                <View key={stat} style={styles.miniScoreRow}>
                  <Text style={styles.miniScoreIcon}>{STAT_ICONS[stat]}</Text>
                  <Text style={styles.miniScoreName}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </Text>
                  <Text style={[styles.miniScoreValue, { color: STAT_COLORS[stat] }]}>
                    {quizResult.scores[stat]}
                  </Text>
                </View>
              ))}
            </View>

            <Button title="See Your Starter Quests" onPress={() => setStep('starter')} />
          </View>
        )}

        {step === 'starter' && quizResult && (
          <View style={styles.step}>
            <Text style={styles.heading}>Your Starter Quests</Text>
            <Text style={styles.body}>
              Based on your profile, here&apos;s a gentle path into your adventure:
            </Text>

            <Text style={styles.sectionLabel}>📋 Daily Quests</Text>
            {getStarterQuests(quizResult.topStats).map((quest, i) => (
              <Card key={`d${i}`} style={styles.questPreview}>
                <View style={styles.questHeader}>
                  <Text style={styles.questIcon}>{STAT_ICONS[quest.stat]}</Text>
                  <Text style={styles.questTitle}>{quest.title}</Text>
                </View>
                <Text style={styles.questDesc}>{quest.description}</Text>
              </Card>
            ))}

            <Text style={styles.sectionLabel}>🗡️ Side Quests</Text>
            <Text style={styles.sectionHint}>One-time goals to stretch your courage with care</Text>

            <Text style={styles.sectionLabel}>🐉 Boss Quest</Text>
            <Text style={styles.sectionHint}>A longer quest for the gift you rely on most</Text>

            <Button title="Looks Great!" onPress={() => setStep('begin')} />
          </View>
        )}

        {step === 'begin' && (
          <View style={styles.step}>
            <Text style={styles.bigIcon}>🌟</Text>
            <Text style={styles.heading}>Ready, {heroName}?</Text>
            <Text style={styles.body}>
              Your journey begins with ordinary magic.{'\n\n'}
              Complete quests to grow your stats, unlock skills, and let your class awaken over
              time.{'\n\n'}
              Every real-world act of care becomes part of your legend.
            </Text>
            <Button title="Begin the First Day" onPress={handleComplete} size="lg" />
          </View>
        )}
      </ScrollView>

      {/* Progress dots */}
      <View style={styles.dots}>
        {totalSteps.map((s, i) => (
          <View key={s} style={[styles.dot, progressIndex >= i && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  step: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  bigIcon: {
    fontSize: 72,
    marginBottom: spacing.lg,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.md,
    ...typography.heading,
  },
  body: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    ...typography.journal,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    padding: spacing.md,
    width: '100%',
    textAlign: 'center',
    marginBottom: spacing.lg,
    ...typography.body,
  },

  // Quiz styles
  quizProgress: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.bgSecondary,
    borderRadius: 2,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  answerList: {
    width: '100%',
    gap: spacing.sm,
  },
  answerCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  answerText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 22,
    ...typography.body,
  },

  // Results styles
  resultStats: {
    width: '100%',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  resultStatRow: {
    width: '100%',
  },
  resultStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  resultRank: {
    color: colors.gold,
    fontSize: fontSize.lg,
    fontWeight: '900',
    width: 30,
  },
  resultStatIcon: {
    fontSize: 22,
  },
  resultStatName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    ...typography.heading,
  },
  resultBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.bgSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 30,
  },
  resultBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  allScores: {
    width: '100%',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  miniScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniScoreIcon: {
    fontSize: 16,
  },
  miniScoreName: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
    ...typography.body,
  },
  miniScoreValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    ...typography.headingWide,
  },

  // Starter quest styles
  sectionLabel: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    ...typography.journal,
  },
  questPreview: {
    marginBottom: spacing.sm,
    width: '100%',
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  questIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  questTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '700',
    ...typography.heading,
  },
  questDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    ...typography.body,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.gold,
    width: 24,
  },

  // Character creation styles
  charPreview: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  charLabel: {
    color: colors.textAccent,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  charRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  charOption: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  charOptionActive: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  charOptionText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.gold,
    borderWidth: 3,
  },
});
