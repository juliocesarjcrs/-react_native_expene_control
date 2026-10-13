import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Icon } from 'react-native-elements';

// Services
import { getAllModels, reloadModels } from '~/services/aiConfigService';

// Components
import { ModelEditor } from './components/ModelEditor';
import { ModelsList } from './components/ModelsList';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';

// Types
import { AIModel } from '~/shared/types/models/ai-model.type';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export default function AIModelsScreen() {
  const config = screenConfigs.aiModels;
  const colors = useThemeColors();

  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  // Carga inicial (loading ya inicia en true)
  useEffect(() => {
    let isMounted = true;

    const loadInitialModels = async () => {
      try {
        const data = await getAllModels();
        if (isMounted) setModels(data);
      } catch (error) {
        if (isMounted) showError(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialModels();

    return () => {
      isMounted = false;
    };
  }, []);

  // Recarga silenciosa (sin spinner a pantalla completa)
  const loadModels = useCallback(async () => {
    try {
      setModels(await getAllModels());
    } catch (error) {
      showError(error);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadModels();
    } finally {
      setRefreshing(false);
    }
  };

  const handleReloadModels = async () => {
    try {
      await reloadModels();
      Alert.alert('Éxito', 'Modelos recargados desde la base de datos');
      await loadModels();
    } catch (error) {
      showError(error);
    }
  };

  const handleCreateModel = () => {
    setSelectedModel(null);
    setShowEditor(true);
  };

  const handleEditModel = (model: AIModel) => {
    setSelectedModel(model);
    setShowEditor(true);
  };

  const handleCloseEditor = async (reloadList = false) => {
    setShowEditor(false);
    setSelectedModel(null);
    if (reloadList) {
      await loadModels();
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.BACKGROUND }]}>
        <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>
          Cargando modelos...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Header */}
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {/* Actions */}
      <View style={[styles.actionsBar, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <MyButton
          title="Nuevo Modelo"
          onPress={handleCreateModel}
          icon={<Icon name="plus" type="material-community" size={18} color={colors.WHITE} />}
        />
        <MyButton
          title="Recargar"
          onPress={handleReloadModels}
          variant="outline"
          icon={<Icon name="refresh" type="material-community" size={18} color={colors.PRIMARY} />}
        />
      </View>

      {/* Lista de modelos */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ModelsList models={models} onEdit={handleEditModel} onReload={loadModels} />
      </ScrollView>

      {/* Modal Editor */}
      <ModelEditor visible={showEditor} model={selectedModel} onClose={handleCloseEditor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 14
  },
  actionsBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8
  },
  content: {
    flex: 1
  }
});
