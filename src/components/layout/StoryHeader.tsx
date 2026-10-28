import React from 'react';
import { Image, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing } from '../../config/theme';

export function ForestScene() {
  const { width } = useWindowDimensions();
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[StyleSheet.absoluteFillObject, width < 600 && { height: 240 }]}
    >
      <Image
        source={require('../../../assets/storybook/forest-sanctuary.png')}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
      />
      <LinearGradient
        colors={['rgba(7,18,15,0.35)', 'rgba(7,18,15,0.45)', colors.bgCanvas]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

export function StoryHeader({
  chapter,
  title,
  subtitle,
}: {
  chapter: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.header}>
      <ForestScene />
      <View style={styles.copy}>
        <Text style={styles.chapter}>{chapter}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: colors.bgCanvas,
  },
  copy: { padding: spacing.lg, backgroundColor: 'rgba(7,18,15,0.28)' },
  chapter: {
    color: colors.goldLight,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: { fontFamily: fonts.heading, fontSize: 30, color: colors.textPrimary, marginBottom: 8 },
  subtitle: { color: colors.textSoft, fontSize: 15, lineHeight: 23, maxWidth: 480 },
});
