import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { walletApi } from '../../services/wallet.service';
import { parseNairaToKobo, formatNaira } from '../../utils/currency';
import { colors, spacing } from '../../constants/theme';

export default function Send() {
  const router = useRouter();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!recipient) {
      Alert.alert('Missing recipient', 'Enter a phone number or email.');
      return;
    }
    const kobo = parseNairaToKobo(amount);
    if (kobo < 10000) {
      Alert.alert('Too small', 'Minimum send is ₦100.');
      return;
    }

    setLoading(true);
    try {
      const result = await walletApi.send(recipient, kobo, note || undefined);
      Alert.alert(
        'Sent ✅',
        `${formatNaira(kobo)} sent.\nNew balance: ${formatNaira(result.newBalance)}`
      );
      router.back();
    } catch (err: any) {
      Alert.alert('Send failed', err.response?.data?.error || 'Try again');
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

        <Text style={styles.title}>Send money</Text>
        <Text style={styles.subtitle}>Transfer to another PAYA user</Text>

        <View style={{ marginTop: spacing.xl }}>
          <Input
            label="Recipient (phone or email)"
            value={recipient}
            onChangeText={setRecipient}
            placeholder="08012345678 or jane@example.com"
            autoCapitalize="none"
          />
          <Input
            label="Amount (₦)"
            value={amount}
            onChangeText={setAmount}
            placeholder="1000"
            keyboardType="numeric"
          />
          <Input
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="What's it for?"
          />
        </View>

        <Button title="Send Money" onPress={handleSubmit} loading={loading} />
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
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
});