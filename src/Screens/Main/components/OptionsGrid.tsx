import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyButton from '~/components/MyButton';

type ActionItem = {
  title: string;
  onPress: () => void;
};

type OptionsGridProps = {
  actions: ActionItem[];
};

export default function OptionsGrid({ actions }: OptionsGridProps) {
  return (
    <View style={styles.grid}>
      {actions.map((a, index) => (
        <View style={styles.item} key={index}>
          <MyButton title={a.title} onPress={a.onPress} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  item: {
    width: '49%',
    marginBottom: 5
  }
});
