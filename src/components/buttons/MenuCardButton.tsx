import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface MenuCardButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
}

export default function MenuCardButton({ title, onPress, color = '#6200ee' }: MenuCardButtonProps) {
  return (
    <Card style={[styles.card, { borderLeftColor: color }]} onPress={onPress}>
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    borderLeftWidth: 6,
    borderRadius: 8,
    elevation: 2
  },
  title: {
    fontSize: 16,
    fontWeight: '600'
  }
});
