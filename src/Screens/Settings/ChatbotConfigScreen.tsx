import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

// Services
import {
  getAllChatbotConfigs,
  updateChatbotConfig,
  toggleChatbotConfig,
  getChatbotConfigHistory,
  invalidateConfigCache
} from '~/services/chatbotConfigService';

// Components
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';
import { ConfigEditor } from '~/components/chatbot-config/ConfigEditor';

// Types
import { ChatbotConfig, ChatbotConfigHistory } from '~/shared/types/models/chatbot-config.type';

// Utils
import { DateFormat } from '~/utils/Helpers';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export const ChatbotConfigScreen = () => {
  const screenConfig = screenConfigs.chatbotConfig;
  const colors = useThemeColors();

  const [configs, setConfigs] = useState<ChatbotConfig[]>([]);
  const [selectedId, setSelectedId] = useState<ChatbotConfig['id'] | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [history, setHistory] = useState<ChatbotConfigHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Siempre se deriva de `configs`, así nunca queda desactualizado
  const selectedConfig = configs.find((c) => c.id === selectedId) ?? null;

  // Carga inicial
  useEffect(() => {
    let isMounted = true;

    const loadInitialConfigs = async () => {
      try {
        const data = await getAllChatbotConfigs(false);
        if (isMounted) setConfigs(data);
      } catch (error) {
        if (isMounted) showError(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialConfigs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Recarga manual (después de guardar o activar/desactivar)
  const fetchConfigs = async () => {
    const data = await getAllChatbotConfigs(false);
    setConfigs(data);
  };

  const loadHistory = async (configKey: string) => {
    try {
      const data = await getChatbotConfigHistory(configKey, 10);
      setHistory(data);
    } catch (error) {
      showError(error);
    }
  };

  const handleReloadCache = async () => {
    try {
      setReloading(true);
      await invalidateConfigCache();
      Alert.alert('Éxito', 'Configuración recargada correctamente');
    } catch (error) {
      showError(error);
    } finally {
      setReloading(false);
    }
  };

  // Devuelve true si se guardó correctamente
  const handleSave = async (newValue: ChatbotConfig['config_value']): Promise<boolean> => {
    if (!selectedConfig) return false;

    try {
      setLoading(true);
      await updateChatbotConfig(selectedConfig.config_key, newValue, 'Ajuste desde admin panel');
      Alert.alert('Éxito', 'Configuración actualizada correctamente');
      await fetchConfigs();
      await invalidateConfigCache();
      return true;
    } catch (error) {
      showError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditorSave = async (newValue: ChatbotConfig['config_value']) => {
    const saved = await handleSave(newValue);
    if (saved) setShowEditor(false);
  };

  const handleToggle = async (item: ChatbotConfig, value: boolean) => {
    try {
      await toggleChatbotConfig(item.config_key, value);
      await fetchConfigs();
      Alert.alert('Éxito', `Configuración ${value ? 'activada' : 'desactivada'}`);
    } catch (error) {
      showError(error);
    }
  };

  const handleSelectConfig = (item: ChatbotConfig) => {
    setSelectedId(item.id);
    setShowHistory(false);
  };

  const handleToggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && selectedConfig) {
      loadHistory(selectedConfig.config_key);
    }
  };

  if (loading && configs.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
        <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>
          Cargando configuraciones...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
    >
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      {/* Botón de recarga global */}
      <View style={[styles.reloadSection, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <MyButton
          title="🔄 Recargar Cache"
          onPress={handleReloadCache}
          loading={reloading}
          variant="secondary"
        />
        <Text style={[styles.reloadHint, { color: colors.TEXT_SECONDARY }]}>
          Aplica los cambios guardados sin reiniciar el servidor
        </Text>
      </View>

      {/* Lista de configuraciones */}
      <View style={[styles.section, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
          Configuraciones disponibles
        </Text>
        {configs.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleSelectConfig(item)}
            style={[
              styles.configCard,
              {
                backgroundColor: colors.BACKGROUND,
                borderColor: selectedId === item.id ? colors.PRIMARY : 'transparent'
              }
            ]}
          >
            <View style={styles.configInfo}>
              <Text style={[styles.configKey, { color: colors.TEXT_PRIMARY }]}>
                {item.config_key}
              </Text>
              {item.description && (
                <Text style={[styles.configDescription, { color: colors.TEXT_SECONDARY }]}>
                  {item.description}
                </Text>
              )}
              <Text style={[styles.configMeta, { color: colors.TEXT_SECONDARY }]}>
                Versión: {item.version} | {DateFormat(item.updated_at, 'DD MMM YYYY hh:mm a')}
              </Text>
            </View>
            <Switch
              value={item.is_active}
              onValueChange={(value) => handleToggle(item, value)}
              trackColor={{ false: colors.GRAY, true: colors.PRIMARY }}
              thumbColor={item.is_active ? colors.PRIMARY : colors.LIGHT_GRAY}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sección de vista/edición */}
      {selectedConfig && (
        <View style={[styles.section, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <View style={styles.editorHeader}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
              {selectedConfig.config_key}
            </Text>
            <TouchableOpacity
              onPress={handleToggleHistory}
              style={[styles.historyButton, { backgroundColor: colors.BACKGROUND }]}
            >
              <Text style={[styles.historyButtonText, { color: colors.TEXT_PRIMARY }]}>
                {showHistory ? 'Ocultar' : 'Ver'} Historial
              </Text>
            </TouchableOpacity>
          </View>

          {showHistory ? (
            <View style={styles.historyContainer}>
              {history.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                  Sin cambios registrados
                </Text>
              ) : (
                history.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.historyItem,
                      { backgroundColor: colors.BACKGROUND, borderLeftColor: colors.PRIMARY }
                    ]}
                  >
                    <Text style={[styles.historyDate, { color: colors.TEXT_PRIMARY }]}>
                      {DateFormat(item.createdAt, 'DD MMM YYYY hh:mm a')}
                    </Text>
                    {item.changedByUser && (
                      <Text style={[styles.historyUser, { color: colors.TEXT_SECONDARY }]}>
                        por {item.changedByUser.name}
                      </Text>
                    )}
                    {item.change_reason && (
                      <Text style={[styles.historyReason, { color: colors.TEXT_SECONDARY }]}>
                        {item.change_reason}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.viewerContainer}>
              <ScrollView
                style={[
                  styles.codeViewer,
                  { borderColor: colors.BORDER, backgroundColor: colors.BACKGROUND }
                ]}
              >
                <Text style={[styles.codeText, { color: colors.TEXT_PRIMARY }]}>
                  {JSON.stringify(selectedConfig.config_value, null, 2)}
                </Text>
              </ScrollView>
              <MyButton title="Editar Configuración" onPress={() => setShowEditor(true)} />
            </View>
          )}
        </View>
      )}

      {/* Modal Editor */}
      {selectedConfig && (
        <ConfigEditor
          visible={showEditor}
          configKey={selectedConfig.config_key}
          configValue={selectedConfig.config_value}
          onSave={handleEditorSave}
          onCancel={() => setShowEditor(false)}
          loading={loading}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14
  },
  reloadSection: {
    marginTop: 16,
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8
  },
  reloadHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center'
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  configCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2
  },
  configInfo: {
    flex: 1,
    marginRight: 12
  },
  configKey: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  configDescription: {
    fontSize: 12,
    marginBottom: 4
  },
  configMeta: {
    fontSize: 11
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
    borderRadius: 4
  },
  historyButtonText: {
    fontSize: 12,
    fontWeight: '600'
  },
  viewerContainer: {
    marginTop: 8
  },
  codeViewer: {
    maxHeight: 300,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11
  },
  historyContainer: {
    marginTop: 8,
    maxHeight: 300
  },
  historyItem: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2
  },
  historyUser: {
    fontSize: 11,
    marginBottom: 4
  },
  historyReason: {
    fontSize: 11,
    fontStyle: 'italic'
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    padding: 20
  }
});
