import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../src/config/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Lost in the Wilderness</Text>
        <Text style={styles.body}>This path leads nowhere, adventurer.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Base Camp</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  link: {
    marginTop: spacing.md,
  },
  linkText: {
    color: colors.gold,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
