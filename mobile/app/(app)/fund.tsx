import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { api } from '../../services/api';
import { parseNairaToKobo, formatNaira } from '../../utils/currency';
import { colors, spacing, radius } from '../../constants/theme';

const QUICK_AMOUNTS = [100000, 500000, 1000000, 5000000]; // kobo

export default function Fund() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const handleQuick = (kobo: number) => setAmount((kobo / 100).toString());

  const handleSubmit = async () => {
    const kobo = parseNairaToKobo(amount);
    if (kobo < 10000) {
      Alert.alert('Too small', 'Minimum funding is ₦100.');
      return;
    }
    if (kobo > 10_000_000) {
      Alert.alert('Too large', 'Max ₦100,000 per funding.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/wallet/paystack/initialize', { amount: kobo });
      setCheckoutUrl(res.data.authorization_url);
      setReference(res.data.reference);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Could not start payment');
    } finally {
      setLoading(false);
    }
  };

  // Called when WebView navigates. Paystack redirects to your callback URL on success.
  const handleNavigation = (navState: any) => {
    const url = navState.url;

    // Paystack test mode redirects to a URL containing 'paystack.co' or your callback
    // When we see the callback URL pattern, payment is done (or cancelled)
    if (url.includes('callback') || url.includes('success')) {
      setCheckoutUrl(null);

      // Verify with backend (which also gets the webhook)
      setTimeout(async () => {
        try {
          const res = await api.get('/wallet/balance');
          Alert.alert(
            'Payment successful ✅',
            `New balance: ${formatNaira(res.data.balance)}`
          );
          router.replace('/(app)/home');
        } catch {
          Alert.alert('Check balance', 'Payment may have succeeded. Pull to refresh on Home.');
          router.replace('/(app)/home');
        }
      }, 2000);
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
          Pay securely with card, bank transfer, or USSD.
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
            <TouchableOpacity key={k} style={styles.quickBtn} onPress={() => handleQuick(k)}>
              <Text style={styles.quickText}>{formatNaira(k)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button title="Pay with Paystack" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>

      {/* Paystack WebView Modal */}
      <Modal visible={!!checkoutUrl} animationType="slide" onRequestClose={() => setCheckoutUrl(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCheckoutUrl(null)}>
              <Text style={styles.backText}>✕ Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Paystack Checkout</Text>
            <View style={{ width: 60 }} />
          </View>
          {checkoutUrl && (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={handleNavigation}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.center}>
                  <Text style={{ color: colors.textMuted }}>Loading checkout…</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});