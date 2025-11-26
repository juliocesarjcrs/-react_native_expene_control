import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Icon } from 'react-native-elements';

// Services
import { getAllModels, reloadModels } from '~/services/aiConfigService';

// Components
import { ModelEditor } from './components/ModelEditor';
import { ModelsList } from './components/ModelsList';
import MyButton from '~/components/MyButton';

// Types
import { AIModel } from '~/shared/types/models/ai-model.type';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

export default function AIModelsScreen() {
  const colors = useThemeColors();
  
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await getAllModels();
      setModels(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadModels();
    setRefreshing(false);
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

  const handleCloseEditor = async (reloadList: boolean = false) => {
    setShowEditor(false);
    setSelectedModel(null);
    if (reloadList) {
      await loadModels();
    }
  };

  if (loading && models.length === 0) {
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
      <View style={[styles.header, { backgroundColor: colors.CARD_BACKGROUND, borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          Modelos de IA
        </Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
          Gestiona los modelos disponibles y su prioridad
        </Text>
      </View>

      {/* Actions */}
      <View style={[styles.actionsBar, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <MyButton
          title="Nuevo Modelo"
          onPress={handleCreateModel}
          icon={<Icon name="plus" type="material-community" size={18} color="#fff" />}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ModelsList
          models={models}
          onEdit={handleEditModel}
          onReload={loadModels}
        />
      </ScrollView>

      {/* Modal Editor */}
      <ModelEditor
        visible={showEditor}
        model={selectedModel}
        onClose={handleCloseEditor}
      />
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
  header: {
    padding: 20,
    borderBottomWidth: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: {
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