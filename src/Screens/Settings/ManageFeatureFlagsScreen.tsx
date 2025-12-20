import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  TouchableOpacity
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { useFeatureFlags } from '~/contexts/FeatureFlagsContext';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';

// Services
import { getAllFeatures, toggleFeature, deleteFeature } from '~/services/featureFlagsService';

// Types
import { SettingsStackParamList } from '../../shared/types';
import { FeatureFlag } from '~/shared/types/models/feature-flags.type';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ManageFeatureFlagsScreenNavigationProp = StackNavigationProp<SettingsStackParamList>;
type ManageFeatureFlagsScreenRouteProp = RouteProp<SettingsStackParamList>;

interface ManageFeatureFlagsScreenProps {
  navigation: ManageFeatureFlagsScreenNavigationProp;
  route: ManageFeatureFlagsScreenRouteProp;
}

export default function ManageFeatureFlagsScreen({ navigation }: ManageFeatureFlagsScreenProps) {
  const config = screenConfigs.manageFeatureFlags;
  const colors = useThemeColors();
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const { refreshFeatures } = useFeatureFlags();

  useEffect(() => {
    fetchFeatures();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFeatures();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const data = await getAllFeatures();
      setFeatures(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (featureKey: string, currentStatus: number) => {
    try {
      setTogglingKey(featureKey);
      const newStatus = currentStatus === 1 ? false : true;

      await toggleFeature(featureKey, newStatus);

      // Actualizar lista local
      setFeatures((prev) =>
        prev.map((f) => (f.featureKey === featureKey ? { ...f, isEnabled: newStatus ? 1 : 0 } : f))
      );

      // Refrescar features globales
      await refreshFeatures();

      Alert.alert(
        'Éxito',
        `Funcionalidad "${featureKey}" ${newStatus ? 'activada' : 'desactivada'} correctamente`
      );
    } catch (error) {
      showError(error);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleEdit = (featureKey: string) => {
    navigation.navigate('createEditFeatureFlag', { featureKey });
  };

  const handleDelete = (featureKey: string, featureName: string) => {
    Alert.alert(
      'Eliminar Funcionalidad',
      `¿Estás seguro de que deseas eliminar "${featureName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFeature(featureKey);
              setFeatures((prev) => prev.filter((f) => f.featureKey !== featureKey));
              await refreshFeatures();
              Alert.alert('Éxito', 'Funcionalidad eliminada correctamente');
            } catch (error) {
              showError(error);
            }
          }
        }
      ]
    );
  };

  const handleCreate = () => {
    navigation.navigate('createEditFeatureFlag', {});
  };

  if (loading) {
    return (
      <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color="#9c27b0" />
        <Text style={styles.loadingText}>Cargando funcionalidades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <ScreenHeader title={config.title} subtitle={config.subtitle} />

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              Gestiona las funcionalidades de la app. Usa el botón (+) para crear nuevas features.
            </Text>
          </View>
        </View>

        {features.map((feature) => (
          <View key={feature.id} style={styles.featureCard}>
            {/* Feature Info */}
            <View style={styles.featureMain}>
              <View style={styles.featureInfo}>
                <View style={styles.featureHeader}>
                  <Text style={styles.featureIcon}>{feature.metadata?.icon || '⚙️'}</Text>
                  <View style={styles.featureTitles}>
                    <Text style={styles.featureName}>{feature.featureName}</Text>
                    <Text style={styles.featureKey}>Key: {feature.featureKey}</Text>
                  </View>
                </View>

                {feature.description && (
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                )}

                {/* Badges */}
                <View style={styles.badgeContainer}>
                  {feature.requiresRole === 1 && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>👑 Solo Admin</Text>
                    </View>
                  )}
                  {feature.defaultForUsers === 0 && (
                    <View style={styles.restrictedBadge}>
                      <Text style={styles.restrictedBadgeText}>🔒 Permiso Explícito</Text>
                    </View>
                  )}
                  {feature.defaultForUsers === 1 && (
                    <View style={styles.openBadge}>
                      <Text style={styles.openBadgeText}>✅ Por Defecto</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Toggle Switch */}
              <View style={styles.switchContainer}>
                {togglingKey === feature.featureKey ? (
                  <ActivityIndicator size="small" color="#9c27b0" />
                ) : (
                  <Switch
                    value={feature.isEnabled === 1}
                    onValueChange={() => handleToggle(feature.featureKey, feature.isEnabled)}
                    trackColor={{ false: '#d3d3d3', true: '#9c27b0' }}
                    thumbColor={feature.isEnabled === 1 ? '#6d1b7b' : '#f4f3f4'}
                  />
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEdit(feature.featureKey)}
              >
                <Text style={styles.editButtonText}>✏️ Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(feature.featureKey, feature.featureName)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {features.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No hay funcionalidades configuradas</Text>
            <Text style={styles.emptySubtext}>Toca el botón (+) para crear una</Text>
          </View>
        )}

        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3'
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 10
  },
  infoContent: {
    flex: 1
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20
  },
  featureCard: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  featureMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  featureInfo: {
    flex: 1,
    marginRight: 10
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 12
  },
  featureTitles: {
    flex: 1
  },
  featureName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  featureKey: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace'
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 8,
    lineHeight: 20
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  adminBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333'
  },
  restrictedBadge: {
    backgroundColor: '#ffcdd2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5
  },
  restrictedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#c62828'
  },
  openBadge: {
    backgroundColor: '#c8e6c9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2e7d32'
  },
  switchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10
  },
  editButton: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  editButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600'
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '600'
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 50
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9c27b0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  fabIcon: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold'
  }
});
