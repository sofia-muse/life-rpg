import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Card } from '../../src/components/layout/Card';
import { Button } from '../../src/components/layout/Button';
import { useAuthStore } from '../../src/store/authStore';
import { useRaidStore, RAID_STAT_OPTIONS } from '../../src/store/raidStore';
import { env } from '../../src/config/env';
import { colors, spacing, fontSize, radius, typography } from '../../src/config/theme';
import { StatName, STAT_COLORS, STAT_ICONS, STAT_NAMES } from '../../src/types';
import { RaidDto } from '../../src/api/raidApi';

type FormMode = 'create' | 'join' | 'contribute' | null;

export default function RaidsScreen() {
  const router = useRouter();
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const canUseRaids = !env.demoMode && authenticated;

  const {
    raids,
    selectedRaidId,
    loading,
    mutating,
    error,
    personal,
    load,
    selectRaid,
    createRaid,
    joinRaid,
    contribute,
  } = useRaidStore();

  const [formMode, setFormMode] = useState<FormMode>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sagaTitle, setSagaTitle] = useState('');
  const [unitLabel, setUnitLabel] = useState('push-ups');
  const [targetAmount, setTargetAmount] = useState('500');
  const [stat, setStat] = useState<StatName>('strength');
  const [rewardTitle, setRewardTitle] = useState('Raid Victor');

  // Join / contribute
  const [inviteCode, setInviteCode] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (canUseRaids) void load();
  }, [canUseRaids, load]);

  const selected = useMemo(
    () => raids.find((r) => r.id === selectedRaidId) ?? raids[0] ?? null,
    [raids, selectedRaidId],
  );

  const resetForms = () => {
    setTitle('');
    setDescription('');
    setSagaTitle('');
    setUnitLabel('push-ups');
    setTargetAmount('500');
    setStat('strength');
    setRewardTitle('Raid Victor');
    setInviteCode('');
    setAmount('');
    setNote('');
    setFormMode(null);
  };

  const onCreate = async () => {
    const target = Number.parseInt(targetAmount, 10);
    if (!title.trim() || !unitLabel.trim() || !Number.isFinite(target)) return;
    const raid = await createRaid({
      title: title.trim(),
      description: description.trim(),
      sagaTitle: sagaTitle.trim() || undefined,
      rewardTitle: rewardTitle.trim() || undefined,
      unitLabel: unitLabel.trim(),
      targetAmount: target,
      stat,
      maxMembers: 8,
    });
    if (raid) resetForms();
  };

  const onJoin = async () => {
    if (!inviteCode.trim()) return;
    const raid = await joinRaid(inviteCode.trim());
    if (raid) resetForms();
  };

  const onContribute = async () => {
    if (!selected) return;
    const value = Number.parseInt(amount, 10);
    if (!Number.isFinite(value) || value <= 0) return;
    const raid = await contribute(selected.id, value, note.trim() || undefined);
    if (raid) resetForms();
  };

  if (!canUseRaids) {
    return (
      <ScreenWrapper contentWidth="regular">
        <ScreenHeader
          eyebrow="Guild Endgame"
          title="Party Raids"
          subtitle="Pool a huge real-world goal with friends — invite codes only."
        />
        <Card style={styles.gateCard}>
          <Text style={styles.gateTitle}>Register to join party raids</Text>
          <Text style={styles.gateBody}>
            {env.demoMode
              ? 'Demo mode is solo-only. Create an account (with demo mode off) to host or join invite-code parties. Shared progress lives on the server so every contribution stays honest.'
              : 'Sign in to create invite-code parties, log your real contributions, and earn shared raid victories plus personal credit.'}
          </Text>
          <View style={styles.gateActions}>
            <Button
              title="Create account"
              onPress={() => router.push({ pathname: '/register', params: { returnTo: 'raids' } })}
            />
            <Button
              title="Sign in"
              onPress={() => router.push({ pathname: '/login', params: { returnTo: 'raids' } })}
              variant="secondary"
            />
          </View>
          {env.demoMode ? (
            <Text style={styles.gateHint}>
              Solo quests, campaigns, and the avatar atelier stay available in demo. Set EXPO_PUBLIC_DEMO_MODE=false, then register to unlock co-op.
            </Text>
          ) : null}
        </Card>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentWidth="regular">
      <ScreenHeader
        eyebrow="Guild Endgame"
        title="Party Raids"
        subtitle={
          personal.raidsCleared > 0
            ? `${personal.raidsCleared} raid${personal.raidsCleared === 1 ? '' : 's'} cleared · ${personal.totalContribution} personal total`
            : 'Create a raid, share the invite code, log what you actually did.'
        }
        action={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setFormMode('join')} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFormMode('create')} style={[styles.headerBtn, styles.headerBtnPrimary]}>
              <Text style={[styles.headerBtnText, styles.headerBtnTextPrimary]}>Create</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && raids.length === 0 ? <Text style={styles.muted}>Loading raids…</Text> : null}

      {raids.length === 0 && !loading ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No party raids yet</Text>
          <Text style={styles.gateBody}>
            Start one — e.g. 500 push-ups this week — and send friends the invite code. Everyone logs their own reps; the party pool decides victory.
          </Text>
          <View style={styles.gateActions}>
            <Button title="Create raid" onPress={() => setFormMode('create')} />
            <Button title="Join with code" onPress={() => setFormMode('join')} variant="secondary" />
          </View>
        </Card>
      ) : null}

      {raids.length > 1 ? (
        <View style={styles.raidTabs}>
          {raids.map((raid) => {
            const active = selected?.id === raid.id;
            return (
              <TouchableOpacity
                key={raid.id}
                style={[styles.raidTab, active && styles.raidTabActive]}
                onPress={() => selectRaid(raid.id)}
              >
                <Text style={[styles.raidTabText, active && styles.raidTabTextActive]} numberOfLines={1}>
                  {raid.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {selected ? <RaidDetail raid={selected} onLog={() => setFormMode('contribute')} mutating={mutating} /> : null}

      <Modal visible={formMode !== null} transparent animationType="fade" onRequestClose={resetForms}>
        <Pressable style={styles.modalBackdrop} onPress={resetForms}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {formMode === 'create' ? (
              <>
                <Text style={styles.modalTitle}>Forge a Raid</Text>
                <Text style={styles.modalSubtitle}>Invite-code party · max 8 heroes</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Raid title"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Saga title (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={sagaTitle}
                  onChangeText={setSagaTitle}
                />
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Description"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.flex]}
                    placeholder="Unit (push-ups)"
                    placeholderTextColor={colors.textMuted}
                    value={unitLabel}
                    onChangeText={setUnitLabel}
                  />
                  <TextInput
                    style={[styles.input, styles.targetInput]}
                    placeholder="Target"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Reward title"
                  placeholderTextColor={colors.textMuted}
                  value={rewardTitle}
                  onChangeText={setRewardTitle}
                />
                <View style={styles.statRow}>
                  {RAID_STAT_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statChip, stat === s && { borderColor: STAT_COLORS[s] }]}
                      onPress={() => setStat(s)}
                    >
                      <Text style={styles.statChipText}>
                        {STAT_ICONS[s]} {s.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button
                  title={mutating ? 'Creating…' : 'Create raid'}
                  onPress={onCreate}
                  loading={mutating}
                  disabled={!title.trim() || !unitLabel.trim()}
                />
              </>
            ) : null}

            {formMode === 'join' ? (
              <>
                <Text style={styles.modalTitle}>Join a Raid</Text>
                <Text style={styles.modalSubtitle}>Enter the party invite code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="IRON-7K2"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                />
                <Button
                  title={mutating ? 'Joining…' : 'Join party'}
                  onPress={onJoin}
                  loading={mutating}
                  disabled={!inviteCode.trim()}
                />
              </>
            ) : null}

            {formMode === 'contribute' && selected ? (
              <>
                <Text style={styles.modalTitle}>Log progress</Text>
                <Text style={styles.modalSubtitle}>
                  {selected.title} · your total {selected.yourContribution} {selected.unitLabel}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Amount (${selected.unitLabel})`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Note (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={note}
                  onChangeText={setNote}
                />
                <Button
                  title={mutating ? 'Logging…' : 'Log contribution'}
                  onPress={onContribute}
                  loading={mutating}
                  disabled={!amount.trim()}
                />
              </>
            ) : null}

            <Button title="Cancel" onPress={resetForms} variant="ghost" style={styles.cancelBtn} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

function RaidDetail({
  raid,
  onLog,
  mutating,
}: {
  raid: RaidDto;
  onLog: () => void;
  mutating: boolean;
}) {
  const progress = Math.min(1, raid.currentAmount / Math.max(1, raid.targetAmount));
  const personalShare = Math.min(1, raid.yourContribution / Math.max(1, raid.targetAmount));
  const statColor = STAT_NAMES.includes(raid.stat) ? STAT_COLORS[raid.stat] : colors.gold;

  return (
    <Card style={styles.detailCard}>
      <Text style={styles.saga}>{raid.sagaTitle || raid.title}</Text>
      <Text style={styles.detailTitle}>{raid.title}</Text>
      {raid.description ? <Text style={styles.detailBody}>{raid.description}</Text> : null}

      <View style={styles.metaRow}>
        <Text style={[styles.metaPill, { color: statColor }]}>
          {STAT_ICONS[raid.stat]} {raid.stat}
        </Text>
        <Text style={styles.metaPill}>
          {raid.memberCount}/{raid.maxMembers} heroes
        </Text>
        <Text style={styles.metaPill}>Code {raid.inviteCode}</Text>
        {raid.isCompleted ? <Text style={styles.clearedPill}>Cleared</Text> : null}
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>
            Party {raid.currentAmount} / {raid.targetAmount} {raid.unitLabel}
          </Text>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: statColor }]} />
        </View>
        <Text style={styles.personalStrip}>
          You contributed {raid.yourContribution} · {Math.round(personalShare * 100)}% of the goal
        </Text>
      </View>

      {!raid.isCompleted ? (
        <Button title="Log progress" onPress={onLog} loading={mutating} style={styles.logBtn} />
      ) : (
        <Text style={styles.victory}>
          Victory — {raid.rewardTitle || 'Raid Victor'}. Personal credit locked for achievements.
        </Text>
      )}

      <Text style={styles.sectionLabel}>Party</Text>
      {raid.members.map((m) => (
        <View key={m.heroId} style={styles.memberRow}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {m.heroName}
              {m.role === 'leader' ? ' · leader' : ''}
            </Text>
            <Text style={styles.memberClass}>{m.className}</Text>
          </View>
          <Text style={styles.memberTotal}>
            {m.personalTotal} {raid.unitLabel}
          </Text>
        </View>
      ))}

      {raid.recentContributions.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Recent logs</Text>
          {raid.recentContributions.slice(0, 8).map((c) => (
            <Text key={c.id} style={styles.contribLine}>
              {c.heroName}: +{c.amount}
              {c.note ? ` — ${c.note}` : ''}
            </Text>
          ))}
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  gateCard: { marginTop: spacing.md, padding: spacing.lg },
  gateTitle: {
    color: colors.gold,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
    ...typography.headingWide,
  },
  gateBody: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22, marginBottom: spacing.md },
  gateHint: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  gateActions: { gap: spacing.sm, marginTop: spacing.sm },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  headerBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerBtnPrimary: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  headerBtnText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  headerBtnTextPrimary: { color: colors.gold },
  error: { color: colors.error, marginBottom: spacing.sm },
  muted: { color: colors.textMuted, marginBottom: spacing.md },
  emptyCard: { padding: spacing.lg },
  emptyTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm },
  raidTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  raidTab: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 160,
  },
  raidTabActive: { borderColor: colors.gold, backgroundColor: 'rgba(212,184,114,0.12)' },
  raidTabText: { color: colors.textMuted, fontSize: fontSize.sm },
  raidTabTextActive: { color: colors.gold, fontWeight: '600' },
  detailCard: { padding: spacing.lg, marginBottom: spacing.xl },
  saga: {
    color: colors.gold,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  detailTitle: { color: colors.textPrimary, fontSize: fontSize.title, fontWeight: '700', marginBottom: spacing.xs },
  detailBody: { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  metaPill: { color: colors.textMuted, fontSize: fontSize.sm, marginRight: spacing.sm },
  clearedPill: { color: colors.gold, fontWeight: '700', fontSize: fontSize.sm },
  progressBlock: { marginBottom: spacing.md },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressLabel: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '600' },
  progressPct: { color: colors.textMuted, fontSize: fontSize.sm },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bgInput,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  barFill: { height: '100%', borderRadius: 5 },
  personalStrip: { color: colors.textSecondary, fontSize: fontSize.sm },
  logBtn: { marginBottom: spacing.md },
  victory: { color: colors.gold, marginBottom: spacing.md, fontWeight: '600' },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberInfo: { flex: 1, paddingRight: spacing.sm },
  memberName: { color: colors.textPrimary, fontWeight: '600' },
  memberClass: { color: colors.textMuted, fontSize: fontSize.sm },
  memberTotal: { color: colors.textSecondary, fontWeight: '600' },
  contribLine: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  modalTitle: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  modalSubtitle: { color: colors.textMuted, marginBottom: spacing.md, marginTop: spacing.xs },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    fontSize: fontSize.md,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  targetInput: { width: 100 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  statChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statChipText: { color: colors.textSecondary, fontSize: fontSize.xs, textTransform: 'uppercase' },
  cancelBtn: { marginTop: spacing.sm },
});
