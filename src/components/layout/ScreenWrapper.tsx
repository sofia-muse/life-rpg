import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
  Platform,
  StyleProp,
  ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../config/theme';
import { resolveContentWidth, useResponsive } from '../../hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  contentWidth?: 'compact' | 'regular' | 'wide' | 'full';
  noTopPadding?: boolean;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'style'>;
}

export function ScreenWrapper({
  children,
  scroll = true,
  style,
  contentStyle,
  contentWidth = 'regular',
  noTopPadding = false,
  scrollProps,
}: Props) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const resolvedWidth = resolveContentWidth(contentWidth);
  const topPadding = noTopPadding ? spacing.md : Platform.OS === 'web' ? spacing.lg : insets.top + spacing.md;

  const content = (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
          paddingBottom: Math.max(insets.bottom + spacing.xl, spacing.xl),
        },
        contentWidth !== 'full' && styles.centered,
        resolvedWidth ? { maxWidth: resolvedWidth } : null,
        style,
      ]}
    >
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
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
    width: '100%',
  },
  centered: {
    alignSelf: 'center',
  },
  inner: {
    width: '100%',
  },
});
