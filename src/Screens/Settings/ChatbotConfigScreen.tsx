import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import MyButton from '~/components/MyButton';
import {
  getAllChatbotConfigs,
  updateChatbotConfig,
  toggleChatbotConfig,
  getChatbotConfigHistory,
  invalidateConfigCache
} from '~/services/chatbotConfigService';
import { ChatbotConfig, ChatbotConfigHistory } from '~/shared/types/models/chatbot-config.type';
import { showError } from '~/utils/showError';

export const ChatbotConfigScreen = () => {
  const [configs, setConfigs] = useState<ChatbotConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ChatbotConfig | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedValue, setEditedValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatbotConfigHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (selectedConfig && showHistory) {
      loadHistory(selectedConfig.config_key);
    }
  }, [selectedConfig, showHistory]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await getAllChatbotConfigs(false);
      setConfigs(data);
    } catch (error) {
      showError(error, 'No se pudieron cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (configKey: string) => {
    try {
      const data = await getChatbotConfigHistory(configKey, 10);
      setHistory(data);
    } catch (error) {
      showError(error, 'Error loading history');
    }
  };

  const handleSave = async () => {
    if (!selectedConfig) return;

    try {
      setLoading(true);
      const parsedValue = JSON.parse(editedValue);

      await updateChatbotConfig(selectedConfig.config_key, parsedValue, 'Ajuste desde admin panel');

      Alert.alert('Éxito', 'Configuración actualizada correctamente');
      setEditMode(false);
      await loadConfigs();

      // Invalidar cache para que los cambios se apliquen inmediatamente
      await invalidateConfigCache();
    } catch (error: any) {
      if (error.message.includes('JSON')) {
        showError(error, 'El JSON ingresado no es válido');
      } else {
        showError(error, 'No se pudo guardar la configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (config: ChatbotConfig, value: boolean) => {
    try {
      await toggleChatbotConfig(config.config_key, value);
      await loadConfigs();
      Alert.alert('Éxito', `Configuración ${value ? 'activada' : 'desactivada'}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado');
      console.error(error);
    }
  };

  const handleSelectConfig = (config: ChatbotConfig) => {
    setSelectedConfig(config);
    setEditedValue(JSON.stringify(config.config_value, null, 2));
    setShowHistory(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && configs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Cargando configuraciones...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración del Chatbot</Text>
        <Text style={styles.subtitle}>Gestiona prompts, herramientas y comportamiento del asistente</Text>
      </View>

      {/* Lista de configuraciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuraciones disponibles</Text>
        {configs.map((config) => (
          <TouchableOpacity
            key={config.id}
            onPress={() => handleSelectConfig(config)}
            style={[styles.configCard, selectedConfig?.id === config.id && styles.configCardSelected]}
          >
            <View style={styles.configInfo}>
              <Text style={styles.configKey}>{config.config_key}</Text>
              {config.description && <Text style={styles.configDescription}>{config.description}</Text>}
              <Text style={styles.configMeta}>
                Versión: {config.version} | {formatDate(config.updated_at)}
              </Text>
            </View>
            <Switch
              value={config.is_active}
              onValueChange={(value) => handleToggle(config, value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={config.is_active ? '#2196f3' : '#f4f3f4'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Editor de configuración */}
      {selectedConfig && (
        <View style={styles.section}>
          <View style={styles.editorHeader}>
            <Text style={styles.sectionTitle}>Editor: {selectedConfig.config_key}</Text>
            <TouchableOpacity onPress={() => setShowHistory(!showHistory)} style={styles.historyButton}>
              <Text style={styles.historyButtonText}>{showHistory ? 'Ocultar' : 'Ver'} Historial</Text>
            </TouchableOpacity>
          </View>

          {showHistory ? (
            <View style={styles.historyContainer}>
              {history.length === 0 ? (
                <Text style={styles.emptyText}>Sin cambios registrados</Text>
              ) : (
                history.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                    {item.changedByUser && <Text style={styles.historyUser}>por {item.changedByUser.name}</Text>}
                    {item.change_reason && <Text style={styles.historyReason}>{item.change_reason}</Text>}
                  </View>
                ))
              )}
            </View>
          ) : editMode ? (
            <View style={styles.editorContainer}>
              <TextInput
                value={editedValue}
                onChangeText={setEditedValue}
                multiline
                style={styles.textEditor}
                placeholder="Ingresa el JSON de configuración..."
                placeholderTextColor="#999"
              />
              <View style={styles.editorActions}>
                <MyButton title="Guardar" loading={loading} onPress={handleSave} />
                <MyButton
                  title="Cancelar"
                  variant="cancel"
                  onPress={() => {
                    setEditMode(false);
                    setEditedValue(JSON.stringify(selectedConfig.config_value, null, 2));
                  }}
                />{' '}
              </View>
            </View>
          ) : (
            <View style={styles.viewerContainer}>
              <ScrollView style={styles.codeViewer}>
                <Text style={styles.codeText}>{editedValue}</Text>
              </ScrollView>
              <MyButton title="Editar Configuración" onPress={() => setEditMode(true)} />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#666'
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  configCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  configCardSelected: {
    borderColor: '#2196f3',
    backgroundColor: '#e3f2fd'
  },
  configInfo: {
    flex: 1,
    marginRight: 12
  },
  configKey: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  configDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  configMeta: {
    fontSize: 11,
    color: '#999'
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  historyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4
  },
  historyButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600'
  },
  editorContainer: {
    marginTop: 8
  },
  textEditor: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 300,
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#fff',
    textAlignVertical: 'top'
  },
  editorActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  viewerContainer: {
    marginTop: 8
  },
  codeViewer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa'
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#333'
  },
  historyContainer: {
    marginTop: 8,
    maxHeight: 300
  },
  historyItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3'
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  historyUser: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4
  },
  historyReason: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20
  }
});
