import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Switch, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { useFeatureFlags } from '~/contexts/FeatureFlagsContext';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';

// Services
import { getAllFeatures, toggleFeature } from '~/services/featureFlagsService';

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
    return navigation.addListener('focus', () => {
      fetchFeatures();
    });
  }, []);

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

  if (loading) {
    return (
      <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color="#9c27b0" />
        <Text style={styles.loadingText}>Cargando funcionalidades...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {features.map((feature) => (
        <View key={feature.id} style={styles.featureCard}>
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

            {feature.requiresRole === 1 && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>👑 Solo Admin</Text>
              </View>
            )}
          </View>

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
      ))}

      {features.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay funcionalidades configuradas</Text>
        </View>
      )}
    </ScrollView>
  );
}

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
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  featureCard: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
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
    lineHeight: 20
  },
  adminBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 8
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333'
  },
  switchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50
  },
  emptyState: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#999'
  }
});
