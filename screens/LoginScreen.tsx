import { signIn } from '@/lib/actions/userActions';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/colors';
import { router } from 'expo-router';
import React from 'react';
import { AppState, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

const LoginScreen: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const handleSignIn = async () => {
    await signIn({ email, password });
    router.push('/library');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.card}>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} />
      </View>
      <View style={styles.card}>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.header,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '400',
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
});

export default LoginScreen;
