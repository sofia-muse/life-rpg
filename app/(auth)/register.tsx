import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../src/components/layout/Button';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, fontSize, radius } from '../../src/config/theme';

function resolveReturnPath(returnTo: string | string[] | undefined): string {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (value === 'raids') return '/raids';
  return '/';
}

export default function RegisterScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const forRaids = resolveReturnPath(returnTo) === '/raids';

  const onSubmit = async () => {
    setLoading(true);
    const ok = await register(email.trim(), password, displayName.trim() || email.trim());
    setLoading(false);
    if (ok) router.replace(resolveReturnPath(returnTo));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Begin Your Legend</Text>
      <Text style={styles.subtitle}>
        {forRaids
          ? 'Create an account to host or join party raids with friends.'
          : 'Create an account to save and sync your progress.'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Display name"
        placeholderTextColor={colors.textMuted}
        value={displayName}
        onChangeText={setDisplayName}
        accessibilityLabel="Display name"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min 8 characters)"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="Password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title="Create Account"
        onPress={onSubmit}
        loading={loading}
        disabled={!email.trim() || password.length < 8}
        style={styles.button}
      />

      <Text style={styles.footer}>
        Already have an account?{' '}
        <Link
          href={forRaids ? { pathname: '/login', params: { returnTo: 'raids' } } : '/login'}
          style={styles.link}
        >
          Sign in
        </Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: spacing.lg, justifyContent: 'center' },
  title: { color: colors.textPrimary, fontSize: fontSize.title, fontWeight: '700', marginBottom: spacing.xs },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.md, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: fontSize.md,
  },
  button: { marginTop: spacing.sm },
  error: { color: colors.error, marginBottom: spacing.md },
  footer: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  link: { color: colors.gold, fontWeight: '700' },
});
