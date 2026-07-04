import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../../config/theme';
import {
  ContentWidth,
  getContentMaxWidth,
  getScreenHorizontalPadding,
  getScreenTopPadding,
} from '../../config/responsive';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentWidth?: ContentWidth;
  showScrollIndicator?: boolean;
}

export function ScreenWrapper({
  children,
  scroll = true,
  style,
  contentWidth = 'wide',
  showScrollIndicator = false,
}: Props) {
  const { width } = useWindowDimensions();
  const contentMaxWidth = getContentMaxWidth(width, contentWidth);
  const horizontalPadding = getScreenHorizontalPadding(width);
  const topPadding = getScreenTopPadding(width, Platform.OS === 'web');

  const content = (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
        },
        contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={showScrollIndicator}
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
    alignSelf: 'center',
    paddingBottom: 32,
  },
});
