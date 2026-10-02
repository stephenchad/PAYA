import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { colors, spacing, radius } from '../../constants/theme';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.logo}>PAYA 💸</Text>
          <Text style={styles.tagline}>Send money.{'\n'}Instantly. Securely.</Text>
        </View>

        <View style={styles.actions}>
          <Button title="Create Account" onPress={() => router.push('/(auth)/signup')} />
          <View style={{ height: spacing.sm }} />
          <Button title="I already have an account" variant="ghost" onPress={() => router.push('/(auth)/login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 56, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  tagline: { fontSize: 20, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, lineHeight: 28 },
  actions: { paddingBottom: spacing.lg },
});