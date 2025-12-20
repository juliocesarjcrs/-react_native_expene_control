import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyButton from '~/components/MyButton';
import { useFeatureFlag } from '~/contexts/FeatureFlagsContext';

type ActionItem = {
  title: string;
  onPress: () => void;
  featureKey?: string;
};

type OptionsGridProps = {
  actions: ActionItem[];
};

export default function OptionsGrid({ actions }: OptionsGridProps) {
  return (
    <View style={styles.grid}>
      {actions.map((action, index) => (
        <ActionButton key={index} action={action} />
      ))}
    </View>
  );
}

// 🆕 Componente interno que verifica permisos
function ActionButton({ action }: { action: ActionItem }) {
  const { isEnabled, loading } = useFeatureFlag(action.featureKey || '');

  // Si tiene featureKey y no está habilitada, no mostrar
  if (action.featureKey && !isEnabled && !loading) {
    return null;
  }

  return (
    <View style={styles.item}>
      <MyButton title={action.title} onPress={action.onPress} disabled={loading} />
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
