import React, { useState, useEffect } from 'react';
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
import { ScreenHeader } from '~/components/ScreenHeader';
export const ChatbotConfigScreen = () => {
  const config = screenConfigs.chatbotConfig;
  const colors = useThemeColors();

  const [configs, setConfigs] = useState<ChatbotConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ChatbotConfig | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
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
      showError(error);
    } finally {
      setLoading(false);
    }
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

  const handleSave = async (newValue: any) => {
    if (!selectedConfig) return;

    try {
      setLoading(true);
      await updateChatbotConfig(selectedConfig.config_key, newValue, 'Ajuste desde admin panel');
      Alert.alert('Éxito', 'Configuración actualizada correctamente');
      await loadConfigs();
      await invalidateConfigCache();
    } catch (error) {
      showError(error);
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
      showError(error);
    }
  };

  const handleSelectConfig = (config: ChatbotConfig) => {
    setSelectedConfig(config);
    setShowHistory(false);
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
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

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
        {configs.map((config) => (
          <TouchableOpacity
            key={config.id}
            onPress={() => handleSelectConfig(config)}
            style={[
              styles.configCard,
              {
                backgroundColor: colors.BACKGROUND,
                borderColor: selectedConfig?.id === config.id ? colors.PRIMARY : 'transparent'
              }
            ]}
          >
            <View style={styles.configInfo}>
              <Text style={[styles.configKey, { color: colors.TEXT_PRIMARY }]}>
                {config.config_key}
              </Text>
              {config.description && (
                <Text style={[styles.configDescription, { color: colors.TEXT_SECONDARY }]}>
                  {config.description}
                </Text>
              )}
              <Text style={[styles.configMeta, { color: colors.TEXT_SECONDARY }]}>
                Versión: {config.version} | {DateFormat(config.updated_at, 'DD MMM YYYY hh:mm a')}
              </Text>
            </View>
            <Switch
              value={config.is_active}
              onValueChange={(value) => handleToggle(config, value)}
              trackColor={{ false: colors.GRAY, true: colors.PRIMARY }}
              thumbColor={config.is_active ? colors.PRIMARY : colors.LIGHT_GRAY}
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
              onPress={() => setShowHistory(!showHistory)}
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
          onSave={async (newValue) => {
            await handleSave(newValue);
            setShowEditor(false);
          }}
          onCancel={() => setShowEditor(false)}
          loading={loading}
        />
      )}
    </ScrollView>
  );
};

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
