import { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/auth.store';
import { colors, spacing, radius } from '../../constants/theme';

export default function Home() {
  const { user, wallet, logout, refreshMe, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    refreshMe();
  }, []);

  const formatNaira = (kobo: number) =>
    '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  if (!hydrated || !user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user.firstName} 👋</Text>
            <Text style={styles.subGreeting}>{user.email}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet balance</Text>
          <Text style={styles.balance}>
            {wallet ? formatNaira(wallet.balance) : '₦0.00'}
          </Text>
          <Text style={styles.currency}>{wallet?.currency || 'NGN'}</Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            🚧 Send money, fund wallet, and transactions coming in the next steps.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 20, fontWeight: '700', color: colors.text },
  subGreeting: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  logoutBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  logoutText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  balance: { color: colors.text, fontSize: 40, fontWeight: '800', marginTop: spacing.sm, letterSpacing: -1 },
  currency: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: spacing.xs },
  placeholder: { marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  placeholderText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});