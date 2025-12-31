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

// Hook auxiliar para verificar si un botón es visible
function useIsActionVisible(action: ActionItem) {
  const { isEnabled, loading } = useFeatureFlag(action.featureKey || '');

  if (!action.featureKey) return true;
  return isEnabled || loading;
}

export default function OptionsGrid({ actions }: OptionsGridProps) {
  // Evaluar la visibilidad de cada acción usando los hooks
  const visibilityStates = actions.map((action) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useIsActionVisible(action);
  });

  // Contar botones realmente visibles
  const visibleCount = visibilityStates.filter(Boolean).length;
  const isSingleButton = visibleCount === 1;

  return (
    <View style={[styles.grid, isSingleButton && styles.gridCentered]}>
      {actions.map((action, index) => (
        <ActionButton key={index} action={action} isSingleButton={isSingleButton} />
      ))}
    </View>
  );
}

// 🆕 Componente interno que verifica permisos
function ActionButton({ action, isSingleButton }: { action: ActionItem; isSingleButton: boolean }) {
  const { isEnabled, loading } = useFeatureFlag(action.featureKey || '');

  // Si tiene featureKey y no está habilitada, no mostrar
  if (action.featureKey && !isEnabled && !loading) {
    return null;
  }

  return (
    <View style={[styles.item, isSingleButton && styles.itemFull]}>
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
  gridCentered: {
    justifyContent: 'center'
  },
  item: {
    width: '49%',
    marginBottom: 5
  },
  itemFull: {
    width: '80%',
    maxWidth: 300,
    alignSelf: 'center'
  }
});
