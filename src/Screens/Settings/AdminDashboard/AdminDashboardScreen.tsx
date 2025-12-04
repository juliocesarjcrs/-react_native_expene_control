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

// Components
import ConversationGroup from '~/components/admin/ConversationGroup';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';

// Services
import {
  getCurrentModel,
  getInteractionLogs,
  getModelErrors,
  getModelsHealth,
  reloadModels
} from '~/services/aiConfigService';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type TabType = 'health' | 'tools' | 'errors';

export default function AdminDashboardScreen() {
  const config = screenConfigs.adminDashboard;
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Recargar según el tab activo
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      showError(error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'health' && {
              borderBottomColor: colors.PRIMARY,
              borderBottomWidth: 2
            }
          ]}
          onPress={() => setActiveTab('health')}
        >
          <Icon
            name="heart-pulse"
            type="material-community"
            color={activeTab === 'health' ? colors.PRIMARY : colors.TEXT_SECONDARY}
            size={20}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'health' ? colors.PRIMARY : colors.TEXT_SECONDARY
              }
            ]}
          >
            Estado
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'tools' && {
              borderBottomColor: colors.PRIMARY,
              borderBottomWidth: 2
            }
          ]}
          onPress={() => setActiveTab('tools')}
        >
          <Icon
            name="tools"
            type="material-community"
            color={activeTab === 'tools' ? colors.PRIMARY : colors.TEXT_SECONDARY}
            size={20}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'tools' ? colors.PRIMARY : colors.TEXT_SECONDARY
              }
            ]}
          >
            Tool Calls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'errors' && {
              borderBottomColor: colors.PRIMARY,
              borderBottomWidth: 2
            }
          ]}
          onPress={() => setActiveTab('errors')}
        >
          <Icon
            name="alert-circle"
            type="material-community"
            color={activeTab === 'errors' ? colors.PRIMARY : colors.TEXT_SECONDARY}
            size={20}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'errors' ? colors.PRIMARY : colors.TEXT_SECONDARY
              }
            ]}
          >
            Errores
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'health' && <ModelsHealthView />}
        {activeTab === 'tools' && <ToolCallsView />}
        {activeTab === 'errors' && <ErrorsView />}
      </ScrollView>
    </View>
  );
}

// ============================================
// Vista de Estado de Modelos
// ============================================
function ModelsHealthView() {
  const colors = useThemeColors();
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [current, models] = await Promise.all([getCurrentModel(), getModelsHealth()]);
      setCurrentModel(current);
      setAllModels(models);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadModels = async () => {
    try {
      await reloadModels();
      Alert.alert('Éxito', 'Modelos recargados correctamente');
      loadData();
    } catch (error) {
      showError(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.TEXT_SECONDARY }}>Cargando...</Text>
      </View>
    );
  }

  const healthColor =
    currentModel?.health?.healthScore > 0.7
      ? colors.SUCCESS
      : currentModel?.health?.healthScore > 0.4
        ? colors.WARNING
        : colors.ERROR;

  return (
    <View style={styles.section}>
      {/* Modelo Actual */}
      <View style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <View style={styles.cardHeader}>
          <Icon name="robot" type="material-community" color={colors.PRIMARY} size={24} />
          <Text style={[styles.cardTitle, { color: colors.TEXT_PRIMARY }]}>Modelo Activo</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: healthColor }]} />
          <Text style={[styles.modelName, { color: colors.TEXT_PRIMARY }]}>
            {currentModel?.model?.name || 'No disponible'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Health Score</Text>
            <Text style={[styles.statValue, { color: healthColor }]}>
              {(currentModel?.health?.healthScore * 100 || 0).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Latencia</Text>
            <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
              {currentModel?.health?.responseTime || 0}ms
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Errores</Text>
            <Text style={[styles.statValue, { color: colors.ERROR }]}>
              {currentModel?.health?.errorCount || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Todos los Modelos */}
      <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>Todos los Modelos</Text>

      {allModels.map((model) => (
        <View
          key={model.id}
          style={[
            styles.modelCard,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <View style={styles.modelHeader}>
            <View>
              <Text style={[styles.modelCardName, { color: colors.TEXT_PRIMARY }]}>
                {model.model_name}
              </Text>
              <Text style={[styles.modelProvider, { color: colors.TEXT_SECONDARY }]}>
                {model.provider_type} • Prioridad: {model.priority}
              </Text>
            </View>
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: model.is_active ? colors.SUCCESS + '20' : colors.GRAY + '20'
                }
              ]}
            >
              <Text
                style={[
                  styles.activeBadgeText,
                  { color: model.is_active ? colors.SUCCESS : colors.GRAY }
                ]}
              >
                {model.is_active ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>

          <View style={styles.modelStats}>
            <Text style={[styles.modelStat, { color: colors.TEXT_SECONDARY }]}>
              Health: {(model.health_score * 100).toFixed(0)}% • Errores: {model.error_count}
            </Text>
          </View>
        </View>
      ))}

      <MyButton
        title="Recargar Modelos"
        onPress={handleReloadModels}
        variant="outline"
        fullWidth
        icon={<Icon name="refresh" type="material-community" size={18} />}
      />
    </View>
  );
}

// ============================================
// Vista de Tool Calls
// ============================================
function ToolCallsView() {
  const colors = useThemeColors();
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getInteractionLogs(50);
      setInteractions(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.TEXT_SECONDARY }}>Cargando...</Text>
      </View>
    );
  }

  if (interactions.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon
          name="information-outline"
          type="material-community"
          color={colors.TEXT_SECONDARY}
          size={48}
        />
        <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
          No hay interacciones registradas aún
        </Text>
      </View>
    );
  }

  // Agrupar por conversación
  const groupedByConversation = interactions.reduce(
    (acc, log) => {
      if (!acc[log.conversationId]) {
        acc[log.conversationId] = [];
      }
      acc[log.conversationId].push(log);
      return acc;
    },
    {} as Record<number, any[]>
  );

  const conversationIds = Object.keys(groupedByConversation)
    .map(Number)
    .sort((a, b) => b - a); // Más recientes primero

  return (
    <View style={styles.section}>
      {/* Stats Header */}
      <View style={[styles.statsCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.PRIMARY }]}>
            {conversationIds.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Conversaciones</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.INFO }]}>{interactions.length}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Iteraciones</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.SUCCESS }]}>
            {interactions.filter((i) => i.tool_result?.success).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Exitosas</Text>
        </View>
      </View>

      {/* Grouped Conversations */}
      <ScrollView>
        {conversationIds.map((convId) => (
          <ConversationGroup
            key={convId}
            conversationId={convId}
            logs={groupedByConversation[convId]}
          />
        ))}
      </ScrollView>

      <MyButton
        title="Actualizar"
        onPress={loadData}
        variant="outline"
        fullWidth
        icon={<Icon name="refresh" type="material-community" size={18} color={colors.PRIMARY} />}
      />
    </View>
  );
}

// ============================================
// Vista de Errores
// ============================================
function ErrorsView() {
  const colors = useThemeColors();
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getModelErrors(20);
      setErrors(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.TEXT_SECONDARY }}>Cargando...</Text>
      </View>
    );
  }

  if (errors.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="check-circle" type="material-community" color={colors.SUCCESS} size={48} />
        <Text style={[styles.emptyText, { color: colors.SUCCESS }]}>
          ¡Sin errores! Todo funciona correctamente 🎉
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>Últimos 20 Errores</Text>

      {errors.map((error, index) => (
        <View
          key={index}
          style={[
            styles.errorCard,
            {
              backgroundColor: colors.ERROR + '10',
              borderColor: colors.ERROR,
              borderLeftWidth: 4
            }
          ]}
        >
          <View style={styles.errorHeader}>
            <Icon name="alert-circle" type="material-community" color={colors.ERROR} size={20} />
            <Text style={[styles.errorModel, { color: colors.ERROR }]}>{error.modelName}</Text>
            <View style={[styles.iterationBadge, { backgroundColor: colors.WARNING + '20' }]}>
              <Text style={[styles.iterationText, { color: colors.WARNING }]}>
                Iter. {error.iteration || 1}
              </Text>
            </View>
          </View>

          <Text style={[styles.errorMessage, { color: colors.TEXT_PRIMARY }]}>{error.error}</Text>

          {/* ✅ AGREGAR: Información adicional */}
          <View style={styles.errorDetails}>
            <Text style={[styles.errorDetail, { color: colors.TEXT_SECONDARY }]}>
              🔧 Tools: {error.supportsTools ? 'Sí' : 'No'}
            </Text>
            {error.tokenCount && (
              <Text style={[styles.errorDetail, { color: colors.TEXT_SECONDARY }]}>
                📊 Tokens: {error.tokenCount.toLocaleString()}
              </Text>
            )}
            {error.finishReason && (
              <Text style={[styles.errorDetail, { color: colors.TEXT_SECONDARY }]}>
                🏁 Finish: {error.finishReason}
              </Text>
            )}
          </View>

          <View style={styles.errorFooter}>
            <Text style={[styles.errorTime, { color: colors.TEXT_SECONDARY }]}>
              {error.responseTime}ms
            </Text>
            <Text style={[styles.timestamp, { color: colors.TEXT_SECONDARY }]}>
              {new Date(error.timestamp).toLocaleString('es-ES')}
            </Text>
          </View>
        </View>
      ))}

      <MyButton
        title="Actualizar"
        onPress={loadData}
        variant="outline"
        fullWidth
        icon={<Icon name="refresh" type="material-community" size={18} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  section: {
    padding: 16
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  // statLabel: {
  //   fontSize: 12,
  //   marginBottom: 4,
  // },
  // statValue: {
  //   fontSize: 18,
  //   fontWeight: '600',
  // },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  modelCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  modelCardName: {
    fontSize: 14,
    fontWeight: '600'
  },
  modelProvider: {
    fontSize: 12,
    marginTop: 2
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  modelStats: {
    marginTop: 4
  },
  modelStat: {
    fontSize: 12
  },
  toolCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  toolModel: {
    fontSize: 12,
    fontWeight: '600'
  },
  toolTime: {
    fontSize: 11
  },
  userQuery: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12
  },
  toolCallItem: {
    marginBottom: 8
  },
  toolCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  toolName: {
    fontSize: 13,
    fontWeight: '600'
  },
  toolParams: {
    fontSize: 11,
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 4
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4
  },
  errorCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  errorModel: {
    fontSize: 13,
    fontWeight: '600'
  },
  errorMessage: {
    fontSize: 13,
    marginBottom: 8
  },
  errorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  errorTime: {
    fontSize: 11
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center'
  },
  iterationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8
  },
  iterationText: {
    fontSize: 10,
    fontWeight: '600'
  },
  errorDetails: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
    flexWrap: 'wrap'
  },
  errorDetail: {
    fontSize: 11
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700'
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase'
  }
});
