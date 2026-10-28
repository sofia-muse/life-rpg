import React, { useState } from 'react';
import { Modal, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Button } from '../layout/Button';
import { colors } from '../../config/theme';

export function SharePreview({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState('');
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error();
      await navigator.clipboard.writeText(message ?? '');
      setStatus('Copied. Paste it wherever you want to share your story.');
    } catch {
      setStatus('Copy is unavailable here. Select the text above and copy it manually.');
    }
  };
  return (
    <Modal visible={message !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.title}>
            Share your story
          </Text>
          <ScrollView style={styles.scroll}>
            <Text selectable style={styles.message}>
              {message}
            </Text>
          </ScrollView>
          {status ? (
            <Text accessibilityLiveRegion="polite" style={styles.status}>
              {status}
            </Text>
          ) : null}
          <Button title="Copy text" onPress={() => void copy()} />
          <Button
            title="Close share preview"
            variant="secondary"
            onPress={() => {
              setStatus('');
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.veil, justifyContent: 'center', padding: 16 },
  sheet: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  title: { fontSize: 24, color: colors.textPrimary },
  scroll: { flexShrink: 1 },
  message: { color: colors.textPrimary, fontSize: 16, lineHeight: 25 },
  status: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
});
