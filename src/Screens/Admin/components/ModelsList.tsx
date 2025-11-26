import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ModelCard } from './ModelCard';
import { AIModel } from '~/shared/types/models/ai-model.type';

interface ModelsListProps {
  models: AIModel[];
  onEdit: (model: AIModel) => void;
  onReload: () => void;
}

export const ModelsList: React.FC<ModelsListProps> = ({ models, onEdit, onReload }) => {
  // Ordenar por prioridad
  const sortedModels = [...models].sort((a, b) => a.priority - b.priority);

  return (
    <View style={styles.container}>
      {sortedModels.map((model) => (
        <ModelCard key={model.id} model={model} onEdit={() => onEdit(model)} onUpdate={onReload} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16
  }
});
