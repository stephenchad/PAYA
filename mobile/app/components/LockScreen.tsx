import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { colors, spacing, radius } from '../constants/theme';

export function LockScreen({ onUnlock }: { onUnlock: () => Promise<boolean> }) {
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    await onUnlock();
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PAYA 💸</Text>
      <Text style={styles.subtitle}>Locked</Text>
      <TouchableOpacity style={styles.button} onPress={handleUnlock} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.buttonText}>Unlock with Biometrics</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: { fontSize: 42, fontWeight: '900', color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: spacing.sm, fontSize: 16 },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
});