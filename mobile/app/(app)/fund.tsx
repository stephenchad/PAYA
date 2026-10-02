import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { walletApi } from '../../services/wallet.service';
import { parseNairaToKobo, formatNaira } from '../../utils/currency';
import { colors, spacing, radius } from '../../constants/theme';

const QUICK_AMOUNTS = [100000, 500000, 1000000, 5000000]; // kobo

export default function Fund() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuick = (kobo: number) => setAmount((kobo / 100).toString());

  const handleSubmit = async () => {
    const kobo = parseNairaToKobo(amount);
    if (kobo <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount.');
      return;
    }
    if (kobo > 10_000_000) {
      Alert.alert('Too large', 'Max ₦100,000 per funding in dev mode.');
      return;
    }

    setLoading(true);
    try {
      await walletApi.fund(kobo, 'Dev funding');
      Alert.alert('Success', `Added ${formatNaira(kobo)} to your wallet.`);
      router.back();
    } catch (err: any) {
      Alert.alert('Funding failed', err.response?.data?.error || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Fund wallet</Text>
        <Text style={styles.subtitle}>
          Dev mode: money is credited instantly. Real Paystack comes in Step 7.
        </Text>

        <View style={{ marginTop: spacing.xl }}>
          <Input
            label="Amount (₦)"
            value={amount}
            onChangeText={setAmount}
            placeholder="5000"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((k) => (
            <TouchableOpacity
              key={k}
              style={styles.quickBtn}
              onPress={() => handleQuick(k)}
            >
              <Text style={styles.quickText}>{formatNaira(k)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button title="Fund Wallet" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg },
  back: { marginBottom: spacing.lg },
  backText: { color: colors.textMuted, fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  quickBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: { color: colors.text, fontSize: 13, fontWeight: '600' },
});