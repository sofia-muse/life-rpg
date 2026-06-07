import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, Platform } from 'react-native';
import { colors } from '../../config/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function ScreenWrapper({ children, scroll = true, style }: Props) {
  const content = <View style={[styles.container, style]}>{children}</View>;

  if (scroll) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.scroll}>{content}</View>;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 48,
    // On web (the hosted demo, viewed on desktop) keep the app phone-shaped and centered
    // instead of stretching edge-to-edge.
    ...Platform.select({
      web: { width: '100%', maxWidth: 480, alignSelf: 'center' as const },
      default: {},
    }),
  },
});
