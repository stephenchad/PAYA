import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: Props) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        isPrimary && styles.primary,
        isGhost && styles.ghost,
        variant === 'danger' && styles.danger,
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.primary : colors.bg} />
      ) : (
        <Text style={[styles.text, isGhost && { color: colors.primary }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  text: { color: colors.bg, fontSize: 16, fontWeight: '700' },
});