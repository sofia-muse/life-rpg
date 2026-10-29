import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { syncManager } from '../../api/syncManager';
import { env } from '../../config/env';
import { Card } from '../layout/Card';
import { Button } from '../layout/Button';
import { colors, spacing, fontSize } from '../../config/theme';

export function SyncStatusPanel() {
  const [status, setStatus] = useState(() => syncManager.getStatus());
  useEffect(() => syncManager.subscribeStatus(setStatus), []);
  return <Card style={styles.card}>
    <Text style={styles.title}>Your saved journey</Text>
    <Text style={styles.body}>{env.demoMode ? 'This demo saves progress on this device. It does not upload a cloud backup.'
      : status.state === 'idle' ? 'All queued changes have been saved to your account.'
      : status.state === 'syncing' ? 'Saving your changes…'
      : `${status.pending} changes are kept on this device and waiting to sync.`}</Text>
    {!env.demoMode && status.lastError && <Text style={styles.body}>{status.lastError}</Text>}
    {!env.demoMode && status.conflicts.length > 0 && <Text style={styles.body}>Some changes need attention: {status.conflicts.map((c) => c.reason).join('; ')}. Your pending changes are retained.</Text>}
    {!env.demoMode && status.pending > 0 && <Button title="Retry saving changes" disabled={status.state === 'syncing'} onPress={() => { void syncManager.retryPending(); }} />}
  </Card>;
}
const styles = StyleSheet.create({ card: { marginBottom: spacing.lg }, title: { color: colors.textAccent, fontSize: fontSize.lg, marginBottom: 12 }, body: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 22, marginBottom: 12 } });
