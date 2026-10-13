import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity
} from 'react-native';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';

// Services
import {
  getUserPermissions,
  grantUserPermission,
  revokeUserPermission,
  getAllFeatures
} from '~/services/featureFlagsService';
import { getUsersList } from '~/services/users';

// Types
import { UserModel } from '../../shared/types';
import { UserFeaturePermission, FeatureFlag } from '~/shared/types/models/feature-flags.type';

// Utils
import { showError } from '~/utils/showError';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';

const NORMAL_USER_ROLE = 0;

const getToggleLabel = (status: boolean | null): string => {
  if (status === null) return '🚫 Denegar';
  if (status === false) return '✅ Permitir';
  return '🔄 Resetear';
};

const getPermissionLabel = (status: boolean | null, feature: FeatureFlag): string => {
  if (status === null) {
    // Sin permiso específico, usar default
    return feature.defaultForUsers === 1 ? '✅ Por defecto' : '⚠️ No accesible';
  }
  return status ? '✅ Permitido' : '❌ Denegado';
};

export default function ManageUserPermissionsScreen() {
  const colors = useThemeColors();
  const [users, setUsers] = useState<UserModel[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [permissions, setPermissions] = useState<UserFeaturePermission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadUserPermissions = useCallback(async (userId: number) => {
    try {
      const perms = await getUserPermissions(userId);
      setPermissions(perms);
    } catch (error) {
      showError(error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [usersData, featuresData] = await Promise.all([
          getUsersList(), // Cargar todos los usuarios
          getAllFeatures() // Cargar todas las features
        ]);
        if (!isMounted) return;

        // Solo usuarios normales
        const normalUsers = usersData.data.filter((u) => u.role === NORMAL_USER_ROLE);
        setUsers(normalUsers);
        setFeatures(featuresData);

        if (normalUsers.length > 0) {
          setSelectedUser(normalUsers[0]);
          const perms = await getUserPermissions(normalUsers[0].id);
          if (isMounted) setPermissions(perms);
        }
      } catch (error) {
        if (isMounted) showError(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectUser = async (user: UserModel) => {
    setSelectedUser(user);
    await loadUserPermissions(user.id);
  };

  const getPermissionStatus = (featureKey: string): boolean | null => {
    const perm = permissions.find((p) => p.featureKey === featureKey);
    if (!perm) return null; // Sin permiso específico
    return perm.isAllowed === 1;
  };

  const handleTogglePermission = async (featureKey: string, currentValue: boolean | null) => {
    if (!selectedUser) return;

    try {
      setToggling(featureKey);

      // Sin permiso específico (null) -> denegar
      // Denegado (false) -> permitir
      // Permitido (true) -> revocar (volver a default)
      if (currentValue === null) {
        await grantUserPermission({
          userId: selectedUser.id,
          featureKey,
          isAllowed: false,
          reason: 'Permiso denegado manualmente'
        });
      } else if (currentValue === false) {
        await grantUserPermission({
          userId: selectedUser.id,
          featureKey,
          isAllowed: true,
          reason: 'Permiso otorgado manualmente'
        });
      } else {
        await revokeUserPermission(selectedUser.id, featureKey);
      }

      // Recargar permisos
      await loadUserPermissions(selectedUser.id);

      Alert.alert('Éxito', 'Permiso actualizado correctamente');
    } catch (error) {
      showError(error);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color="#9c27b0" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader
        title="Gestionar Permisos de Usuario"
        subtitle="Asigna o deniega acceso a funcionalidades específicas"
      />

      {/* Selector de Usuario */}
      <View style={styles.userSelectorContainer}>
        <Text style={styles.sectionTitle}>Seleccionar Usuario:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={[styles.userCard, selectedUser?.id === user.id && styles.userCardSelected]}
              onPress={() => handleSelectUser(user)}
            >
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Permisos */}
      {selectedUser && (
        <View style={styles.permissionsContainer}>
          <Text style={styles.sectionTitle}>Permisos de {selectedUser.name}:</Text>

          {features.map((feature) => {
            const permissionStatus = getPermissionStatus(feature.featureKey);
            const isToggling = toggling === feature.featureKey;

            return (
              <View key={feature.id} style={styles.permissionCard}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureIcon}>{feature.metadata?.icon || '⚙️'}</Text>
                  <View style={styles.featureTitles}>
                    <Text style={styles.featureName}>{feature.featureName}</Text>
                    <Text style={styles.featureKey}>Key: {feature.featureKey}</Text>
                    {feature.description && (
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    )}
                    <Text
                      style={[
                        styles.permissionStatus,
                        permissionStatus === true && styles.permissionAllowed,
                        permissionStatus === false && styles.permissionDenied,
                        permissionStatus === null && styles.permissionDefault
                      ]}
                    >
                      {getPermissionLabel(permissionStatus, feature)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  {isToggling ? (
                    <ActivityIndicator size="small" color="#9c27b0" />
                  ) : (
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => handleTogglePermission(feature.featureKey, permissionStatus)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {getToggleLabel(permissionStatus)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {users.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay usuarios disponibles</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  userSelectorContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  userCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginRight: 10,
    borderRadius: 10,
    minWidth: 150,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  userCardSelected: {
    borderColor: '#9c27b0',
    backgroundColor: '#f3e5f5'
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  permissionsContainer: {
    padding: 15
  },
  permissionCard: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
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
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 12
  },
  featureTitles: {
    flex: 1
  },
  featureName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  featureKey: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2
  },
  featureDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 4
  },
  permissionStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    overflow: 'hidden'
  },
  permissionAllowed: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32'
  },
  permissionDenied: {
    backgroundColor: '#ffcdd2',
    color: '#c62828'
  },
  permissionDefault: {
    backgroundColor: '#fff3e0',
    color: '#e65100'
  },
  actionButtons: {
    marginLeft: 10
  },
  toggleButton: {
    backgroundColor: '#9c27b0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
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
