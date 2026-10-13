import React, { useCallback, useEffect, useState } from 'react';
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

// ============================================
// Tipos y constantes
// ============================================
type AppColors = ReturnType<typeof useThemeColors>;
type TabType = 'health' | 'tools' | 'errors';
type Interaction = Awaited<ReturnType<typeof getInteractionLogs>>[number];

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'health', label: 'Estado', icon: 'heart-pulse' },
  { key: 'tools', label: 'Tool Calls', icon: 'tools' },
  { key: 'errors', label: 'Errores', icon: 'alert-circle' }
];

const HEALTH_GOOD = 0.7;
const HEALTH_WARNING = 0.4;

const getHealthColor = (score: number, colors: AppColors): string => {
  if (score > HEALTH_GOOD) return colors.SUCCESS;
  if (score > HEALTH_WARNING) return colors.WARNING;
  return colors.ERROR;
};

const groupByConversation = (logs: Interaction[]): Record<number, Interaction[]> => {
  const groups: Record<number, Interaction[]> = {};
  logs.forEach((log) => {
    if (!groups[log.conversationId]) {
      groups[log.conversationId] = [];
    }
    groups[log.conversationId].push(log);
  });
  return groups;
};

// Funciones de fetch a nivel de módulo (referencias estables para el hook)
const fetchHealthData = async () => {
  const [current, models] = await Promise.all([getCurrentModel(), getModelsHealth()]);
  return { current, models };
};
const fetchInteractions = () => getInteractionLogs(50);
const fetchErrors = () => getModelErrors(20);

// ============================================
// Hook de carga remota
// ============================================
function useRemoteData<T>(fetcher: () => Promise<T>, refreshToken: number, onLoaded: () => void) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const result = await fetcher();
        if (isMounted) setData(result);
      } catch (error) {
        if (isMounted) showError(error);
      } finally {
        if (isMounted) {
          setLoading(false);
          onLoaded();
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [fetcher, refreshToken, reloadCount, onLoaded]);

  // Recarga manual con spinner
  const reload = () => {
    setLoading(true);
    setReloadCount((count) => count + 1);
  };

  return { data, loading, reload };
}

// ============================================
// Pantalla principal
// ============================================
export default function AdminDashboardScreen() {
  const config = screenConfigs.adminDashboard;
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleLoaded = useCallback(() => setRefreshing(false), []);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshToken((token) => token + 1);
  };

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {/* Tabs */}
      <View
        style={[
          styles.tabs,
          { backgroundColor: colors.CARD_BACKGROUND, shadowColor: colors.BLACK }
        ]}
      >
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.key}
            onPress={() => setActiveTab(tab.key)}
            colors={colors}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'health' && (
          <ModelsHealthView refreshToken={refreshToken} onLoaded={handleLoaded} />
        )}
        {activeTab === 'tools' && (
          <ToolCallsView refreshToken={refreshToken} onLoaded={handleLoaded} />
        )}
        {activeTab === 'errors' && (
          <ErrorsView refreshToken={refreshToken} onLoaded={handleLoaded} />
        )}
      </ScrollView>
    </View>
  );
}

// ============================================
// Botón de tab
// ============================================
interface TabButtonProps {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
  colors: AppColors;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, active, onPress, colors }) => {
  const tint = active ? colors.PRIMARY : colors.TEXT_SECONDARY;

  return (
    <TouchableOpacity
      style={[
        styles.tab,
        active && { borderBottomColor: colors.PRIMARY },
        active && styles.tabActive
      ]}
      onPress={onPress}
    >
      <Icon name={icon} type="material-community" color={tint} size={20} />
      <Text style={[styles.tabText, { color: tint }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ============================================
// Props comunes de las vistas
// ============================================
interface ViewProps {
  refreshToken: number;
  onLoaded: () => void;
}

// ============================================
// Vista de Estado de Modelos
// ============================================
function ModelsHealthView({ refreshToken, onLoaded }: ViewProps) {
  const colors = useThemeColors();
  const { data, loading, reload } = useRemoteData(fetchHealthData, refreshToken, onLoaded);

  const currentModel = data?.current;
  const allModels = data?.models ?? [];

  const handleReloadModels = async () => {
    try {
      await reloadModels();
      Alert.alert('Éxito', 'Modelos recargados correctamente');
      reload();
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

  const healthScore = currentModel?.health?.healthScore ?? 0;
  const healthColor = getHealthColor(healthScore, colors);

  return (
    <View style={styles.section}>
      {/* Modelo Actual */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.CARD_BACKGROUND, shadowColor: colors.BLACK }
        ]}
      >
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
              {(healthScore * 100).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Latencia</Text>
            <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
              {currentModel?.health?.responseTime ?? 0}ms
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Errores</Text>
            <Text style={[styles.statValue, { color: colors.ERROR }]}>
              {currentModel?.health?.errorCount ?? 0}
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
        icon={<Icon name="refresh" type="material-community" size={18} color={colors.PRIMARY} />}
      />
    </View>
  );
}

// ============================================
// Vista de Tool Calls
// ============================================
function ToolCallsView({ refreshToken, onLoaded }: ViewProps) {
  const colors = useThemeColors();
  const { data, loading, reload } = useRemoteData(fetchInteractions, refreshToken, onLoaded);

  const interactions = data ?? [];

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

  const groupedByConversation = groupByConversation(interactions);

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
      <View>
        {conversationIds.map((convId) => (
          <ConversationGroup
            key={convId}
            conversationId={convId}
            logs={groupedByConversation[convId]}
          />
        ))}
      </View>

      <MyButton
        title="Actualizar"
        onPress={reload}
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
function ErrorsView({ refreshToken, onLoaded }: ViewProps) {
  const colors = useThemeColors();
  const { data, loading, reload } = useRemoteData(fetchErrors, refreshToken, onLoaded);

  const errors = data ?? [];

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

      {errors.map((error) => (
        <View
          key={`${error.timestamp}-${error.modelName}-${error.iteration}`}
          style={[
            styles.errorCard,
            {
              backgroundColor: colors.ERROR + '10',
              borderColor: colors.ERROR
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

          {/* Información adicional */}
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
        onPress={reload}
        variant="outline"
        fullWidth
        icon={<Icon name="refresh" type="material-community" size={18} color={colors.PRIMARY} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    elevation: 2,
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
  tabActive: {
    borderBottomWidth: 2
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
  timestamp: {
    fontSize: 11,
    marginTop: 4
  },
  errorCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4
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
