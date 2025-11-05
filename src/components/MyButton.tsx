import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PRIMARY, ERROR, TEXT_PRIMARY } from '~/styles/colors';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  color?: string;
  variant?: 'primary' | 'cancel';
}

export default function MyButton({
  title,
  onPress,
  loading = false,
  color,
  variant = 'primary',
}: Props) {
  const backgroundColor =
    color ??
    (variant === 'cancel'
      ? 'transparent'
      : PRIMARY);

  const textColor = variant === 'cancel' ? TEXT_PRIMARY : '#FFF';
  const borderWidth = variant === 'cancel' ? 1 : 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: pressed ? 0.7 : 1, borderWidth },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
