import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button } from '../../src/components/layout/Button';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, fontSize, radius } from '../../src/config/theme';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back, Hero</Text>
      <Text style={styles.subtitle}>Sign in to sync your adventure across devices.</Text>

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
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="Password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title="Sign In"
        onPress={onSubmit}
        loading={loading}
        disabled={!email.trim() || !password}
        style={styles.button}
      />

      <Text style={styles.footer}>
        New here?{' '}
        <Link href="/register" style={styles.link}>
          Create a hero
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
