import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  StatName,
} from '../src/types';
import { QUIZ_QUESTIONS, calculateQuizResults, QuizResult } from '../src/config/quiz';
import { pickRandomTemplates } from '../src/config/questTemplates';
import { getStarterQuests } from '../src/config/classes';
import { NiceAvatarCharacter } from '../src/components/avatar/NiceAvatarCharacter';
import { SKIN_TONE_COLORS, HAIR_COLOR_VALUES } from '../src/config/appearanceConfig';
import {
  getContentMaxWidth,
  getScreenHorizontalPadding,
  getScreenTopPadding,
  getViewportSize,
} from '../src/config/responsive';

type Step = 'welcome' | 'name' | 'character' | 'quiz' | 'results' | 'starter' | 'begin';

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
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
    const focusStats: StatName[] = quizResult?.topStats ?? ['strength', 'vitality', 'willpower'];
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
  const totalSteps: Step[] = ['welcome', 'name', 'character', 'quiz', 'results', 'starter', 'begin'];
  const progressIndex = step === 'quiz' ? 3 : totalSteps.indexOf(step);
  const viewport = getViewportSize(width);
  const showWideShell = viewport !== 'phone';
  const showSplitLayout = width >= 980;
  const showWideAnswerGrid = width >= 860;
  const shellPadding = getScreenHorizontalPadding(width);
  const topPadding = getScreenTopPadding(width, Platform.OS === 'web');
  const shellMaxWidth = getContentMaxWidth(width, 'wide') ?? 1200;
  const previewName = heroName.trim() || 'Your Hero';
  const focusPreviewStats: StatName[] = quizResult?.topStats ?? ['strength', 'vitality', 'willpower'];
  const stepLabels: Record<Step, string> = {
    welcome: 'Welcome',
    name: 'Naming',
    character: 'Appearance',
    quiz: 'Class Reading',
    results: 'Profile',
    starter: 'Starter Quests',
    begin: 'First Day',
  };
  const stepNarratives: Record<Step, string> = {
    welcome: 'A calm beginning for turning real-world care into a living fantasy record.',
    name: 'Give the journey a name before the rest of the ritual takes shape.',
    character: 'Choose a form that feels familiar. The class can awaken later.',
    quiz: 'A few reflective choices reveal which strengths are already stirring.',
    results: 'Your strongest gifts gather into a path you can actually live with.',
    starter: 'Small opening quests make the first days feel ceremonial, not overwhelming.',
    begin: 'Everything is ready. The sanctuary opens when you decide to take the first step.',
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgCanvas, colors.bgPrimary, '#18122B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: shellPadding,
            paddingTop: topPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.shell, { maxWidth: shellMaxWidth }, showWideShell && styles.shellWide]}>
          {showWideShell && (
            <View style={[styles.aside, showSplitLayout && styles.asideWide]}>
              <Text style={styles.asideEyebrow}>First Dawn</Text>
              <Text style={styles.asideTitle}>Enter the Sanctuary</Text>
              <Text style={styles.asideBody}>{stepNarratives[step]}</Text>

              <View style={styles.asideAvatarPanel}>
                <NiceAvatarCharacter
                  appearance={charAppearance}
                  dominantStat={quizResult?.topStats[0] ?? 'strength'}
                  classTier={1}
                  size={showSplitLayout ? 144 : 124}
                />
                <Text style={styles.asideHeroName}>{previewName}</Text>
                <Text style={styles.asideHeroMeta}>
                  {quizResult
                    ? `${quizResult.topStats
                        .map((stat) => stat.charAt(0).toUpperCase() + stat.slice(1))
                        .join(' • ')}`
                    : 'A gentle adventure built from real routines.'}
                </Text>
              </View>

              <View style={styles.asideProgressBlock}>
                <Text style={styles.asideProgressLabel}>Journey Progress</Text>
                <Text style={styles.asideProgressValue}>
                  {progressIndex + 1} of {totalSteps.length}
                </Text>
                <View style={styles.asideDots}>
                  {totalSteps.map((s, i) => (
                    <View key={s} style={[styles.dot, progressIndex >= i && styles.dotActive]} />
                  ))}
                </View>
              </View>

              <View style={styles.asideStatChips}>
                {focusPreviewStats.map((stat) => (
                  <View key={stat} style={[styles.asideStatChip, { borderColor: `${STAT_COLORS[stat]}66` }]}>
                    <Text style={styles.asideStatIcon}>{STAT_ICONS[stat]}</Text>
                    <Text style={[styles.asideStatText, { color: STAT_COLORS[stat] }]}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Card style={[styles.stepCard, showWideShell && styles.stepCardWide]}>
            <View style={styles.stepCardContent}>
              <Text style={styles.stepEyebrow}>Rite of Beginning • {stepLabels[step]}</Text>

              {step === 'welcome' && (
                <View style={styles.stepCenter}>
                  <Text style={styles.bigIcon}>⚔️</Text>
                  <Text style={styles.heading}>Welcome, Adventurer</Text>
                  <Text style={styles.body}>
                    Your real life can become a gentler kind of quest.{'\n\n'}
                    Build small rituals. Earn XP. Let everyday acts of care shape your legend.
                  </Text>
                  <Button title="Begin Your Journey" onPress={() => setStep('name')} style={styles.ctaButton} />
                </View>
              )}

              {step === 'name' && (
                <View style={styles.stepCenter}>
                  <Text style={styles.bigIcon}>🏰</Text>
                  <Text style={styles.heading}>Name Your Hero</Text>
                  <Text style={styles.body}>What name will your journey answer to?</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your name..."
                      placeholderTextColor={colors.textMuted}
                      value={heroName}
                      onChangeText={setHeroName}
                      maxLength={20}
                      autoFocus
                    />
                  </View>
                  <Button
                    title="Next"
                    onPress={() => setStep('character')}
                    disabled={heroName.trim().length === 0}
                    style={styles.ctaButton}
                  />
                </View>
              )}

              {step === 'character' && (
                <View style={styles.stepWideContent}>
                  <Text style={styles.heading}>Shape Your Hero</Text>
                  <Text style={styles.body}>
                    Pick a form that feels familiar. This is only the first silhouette of your legend.
                  </Text>

                  <View style={[styles.characterShell, showSplitLayout && styles.characterShellWide]}>
                    <View style={styles.characterPreviewPanel}>
                      <NiceAvatarCharacter
                        appearance={charAppearance}
                        dominantStat="strength"
                        classTier={1}
                        size={showSplitLayout ? 164 : 124}
                      />
                      <Text style={styles.previewTitle}>{previewName}</Text>
                      <Text style={styles.previewHint}>Your crest, class, and rituals will build from here.</Text>
                    </View>

                    <View style={styles.characterControls}>
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
                    </View>
                  </View>

                  <Button
                    title="Next"
                    onPress={() => {
                      setCurrentQuestion(0);
                      setQuizAnswers([]);
                      setStep('quiz');
                    }}
                    style={styles.ctaButtonSpaced}
                  />
                </View>
              )}

              {step === 'quiz' && question && (
                <View style={styles.stepWideContent}>
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
                  <View style={[styles.answerList, showWideAnswerGrid && styles.answerListWide]}>
                    {question.answers.map((answer, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.answerCard, showWideAnswerGrid && styles.answerCardWide]}
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
                <View style={styles.stepWideContent}>
                  <Text style={styles.bigIcon}>🔮</Text>
                  <Text style={styles.heading}>Your Adventurer Profile</Text>
                  <Text style={styles.body}>
                    Based on your answers, these are the gifts that shine brightest right now:
                  </Text>

                  <View style={[styles.resultsGrid, showSplitLayout && styles.resultsGridWide]}>
                    <View style={styles.resultsPrimary}>
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
                    </View>

                    <View style={styles.allScoresPanel}>
                      <Text style={[styles.sectionLabel, styles.sectionLabelCompact]}>Full Constellation</Text>
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
                    </View>
                  </View>

                  <Button title="See Your Starter Quests" onPress={() => setStep('starter')} style={styles.ctaButton} />
                </View>
              )}

              {step === 'starter' && quizResult && (
                <View style={styles.stepWideContent}>
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

                  <View style={[styles.previewInfoGrid, showWideAnswerGrid && styles.previewInfoGridWide]}>
                    <View style={styles.previewInfoCard}>
                      <Text style={[styles.sectionLabel, styles.sectionLabelCompact]}>🗡️ Side Quests</Text>
                      <Text style={styles.sectionHint}>One-time goals to stretch your courage with care.</Text>
                    </View>
                    <View style={styles.previewInfoCard}>
                      <Text style={[styles.sectionLabel, styles.sectionLabelCompact]}>🐉 Boss Quest</Text>
                      <Text style={styles.sectionHint}>A longer quest for the gift you rely on most.</Text>
                    </View>
                  </View>

                  <Button title="Looks Great!" onPress={() => setStep('begin')} style={styles.ctaButton} />
                </View>
              )}

              {step === 'begin' && (
                <View style={styles.stepCenter}>
                  <Text style={styles.bigIcon}>🌟</Text>
                  <Text style={styles.heading}>Ready, {heroName}?</Text>
                  <Text style={styles.body}>
                    Your journey begins with ordinary magic.{'\n\n'}
                    Complete quests to grow your stats, unlock skills, and let your class awaken over
                    time.{'\n\n'}
                    Every real-world act of care becomes part of your legend.
                  </Text>
                  <Button title="Begin the First Day" onPress={handleComplete} size="lg" style={styles.ctaButton} />
                </View>
              )}
            </View>
          </Card>
        </View>

        {!showWideShell && (
          <View style={styles.dots}>
            {totalSteps.map((s, i) => (
              <View key={s} style={[styles.dot, progressIndex >= i && styles.dotActive]} />
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: spacing.xl,
  },
  glowTop: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.amethystGlow,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 60,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.goldGlow,
  },
  shell: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  shellWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  aside: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17, 22, 43, 0.78)',
    padding: spacing.lg,
    gap: spacing.md,
    minWidth: 280,
  },
  asideWide: {
    flex: 0.92,
    maxWidth: 360,
  },
  asideEyebrow: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  asideTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    ...typography.heading,
  },
  asideBody: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    ...typography.journal,
  },
  asideAvatarPanel: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(30, 42, 74, 0.45)',
  },
  asideHeroName: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    ...typography.heading,
  },
  asideHeroMeta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 19,
    ...typography.body,
  },
  asideProgressBlock: {
    gap: spacing.xs,
  },
  asideProgressLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  asideProgressValue: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    ...typography.heading,
  },
  asideDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  asideStatChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  asideStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: 'rgba(15, 15, 26, 0.5)',
  },
  asideStatIcon: {
    fontSize: 14,
  },
  asideStatText: {
    fontSize: fontSize.sm,
    ...typography.headingWide,
  },
  stepCard: {
    width: '100%',
  },
  stepCardWide: {
    flex: 1,
    minHeight: 640,
  },
  stepCardContent: {
    width: '100%',
  },
  stepEyebrow: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    textAlign: 'center',
    ...typography.headingWide,
  },
  step: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  stepCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  stepWideContent: {
    width: '100%',
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
  ctaButton: {
    alignSelf: 'center',
    minWidth: 220,
  },
  ctaButtonSpaced: {
    alignSelf: 'center',
    minWidth: 220,
    marginTop: spacing.lg,
  },
  inputWrap: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
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
  answerListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  answerCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  answerCardWide: {
    flexBasis: '48%',
    flexGrow: 1,
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
  resultsGrid: {
    width: '100%',
    gap: spacing.lg,
  },
  resultsGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultsPrimary: {
    flex: 1.15,
    minWidth: 0,
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
  allScoresPanel: {
    flex: 0.85,
    minWidth: 240,
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
  sectionLabelCompact: {
    marginTop: 0,
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginTop: spacing.xs,
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
  previewInfoGrid: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  previewInfoGridWide: {
    flexDirection: 'row',
  },
  previewInfoCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17, 22, 43, 0.62)',
    padding: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
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
  characterShell: {
    gap: spacing.lg,
    width: '100%',
  },
  characterShellWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  characterPreviewPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(30, 42, 74, 0.5)',
  },
  previewTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    textAlign: 'center',
    ...typography.heading,
  },
  previewHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 19,
    ...typography.body,
  },
  characterControls: {
    flex: 1,
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
    minWidth: 120,
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
