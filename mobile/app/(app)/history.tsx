import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { walletApi } from '../../services/wallet.service';
import { formatNaira } from '../../utils/currency';
import { colors, spacing, radius } from '../../constants/theme';

interface Txn {
  id: string;
  type: 'fund' | 'send' | 'receive';
  status: string;
  amount: number;
  balanceAfter: number;
  counterpartyName: string | null;
  reference: string;
  note: string | null;
  createdAt: string;
}

export default function History() {
  const router = useRouter();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await walletApi.history(50, 0);
      setTxns(data.transactions);
    } catch (err) {
      console.log('history error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const typeLabel = (t: string) =>
    t === 'fund' ? 'Funded' : t === 'send' ? 'Sent' : 'Received';

  const typeColor = (t: string) =>
    t === 'send' ? colors.danger : colors.primary;

  const renderItem = ({ item }: { item: Txn }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>
          {typeLabel(item.type)}
          {item.counterpartyName ? ` • ${item.counterpartyName}` : ''}
        </Text>
        <Text style={styles.rowSub}>
          {new Date(item.createdAt).toLocaleString('en-NG', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {item.note ? ` • ${item.note}` : ''}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: typeColor(item.type) }]}>
        {item.type === 'send' ? '-' : '+'}
        {formatNaira(item.amount)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : txns.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No transactions yet.</Text>
        </View>
      ) : (
        <FlatList
          data={txns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  back: { padding: spacing.sm, marginLeft: -spacing.sm },
  backText: { color: colors.textMuted, fontSize: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.textMuted, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700' },
});