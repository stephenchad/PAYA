import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../store/auth.store';

export default function SignUp() {
  const router = useRouter();
  const { register, loading } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    const { firstName, lastName, email, phone, password } = form;

    if (!firstName || !lastName || !email || !phone || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    try {
      await register(form);
      router.replace('/(app)/home');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.details || 'Registration failed';
      Alert.alert('Sign up failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>It takes less than a minute.</Text>

        <View style={{ marginTop: spacing.xl }}>
          <Input label="First name" value={form.firstName} onChangeText={update('firstName')} placeholder="Stephen" />
          <Input label="Last name" value={form.lastName} onChangeText={update('lastName')} placeholder="Chad" />
          <Input
            label="Email"
            value={form.email}
            onChangeText={update('email')}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChangeText={update('phone')}
            placeholder="08012345678"
            keyboardType="phone-pad"
          />
          <Input
            label="Password"
            value={form.password}
            onChangeText={update('password')}
            placeholder="At least 8 characters"
            secureTextEntry
          />
        </View>

        <Button title="Create Account" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: { marginBottom: spacing.lg },
  backText: { color: colors.textMuted, fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs },
});