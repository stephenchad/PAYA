import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../store/auth.store';
import { walletApi } from '../../services/wallet.service';
import { formatNaira } from '../../utils/currency';
import { colors, spacing, radius } from '../../constants/theme';

export default function Home() {
  const { user, wallet, logout, refreshMe, hydrated } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(wallet?.balance ?? 0);

  const loadBalance = async () => {
    try {
      const data = await walletApi.getBalance();
      setBalance(data.balance);
    } catch (err) {
      console.log('loadBalance error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (hydrated) {
        loadBalance();
        refreshMe();
      }
    }, [hydrated])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBalance();
    await refreshMe();
    setRefreshing(false);
  };

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
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
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
          <Text style={styles.balance}>{formatNaira(balance)}</Text>
          <Text style={styles.currency}>NGN</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(app)/fund')}
          >
            <Text style={styles.actionIcon}>＋</Text>
            <Text style={styles.actionLabel}>Fund</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(app)/send')}
          >
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionLabel}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(app)/history')}
          >
            <Text style={styles.actionIcon}>≡</Text>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 20, fontWeight: '700', color: colors.text },
  subGreeting: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  balance: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    marginTop: spacing.sm,
    letterSpacing: -1,
  },
  currency: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: spacing.xs },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: { fontSize: 24, color: colors.primary, fontWeight: '700' },
  actionLabel: { color: colors.text, fontSize: 13, marginTop: 6, fontWeight: '600' },
});