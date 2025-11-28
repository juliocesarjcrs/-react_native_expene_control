import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { getAllThemes, activateTheme } from '../../services/themeConfigService';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';

// Types
import { SettingsStackParamList } from '../../shared/types';
import { ThemeConfig } from '~/shared/types/models/theme-config.type';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ManageThemesScreenNavigationProp = StackNavigationProp<SettingsStackParamList>;
type ManageThemesScreenRouteProp = RouteProp<SettingsStackParamList>;

type ManageThemesScreenProps = {
  navigation: ManageThemesScreenNavigationProp;
  route: ManageThemesScreenRouteProp;
};

export default function ManageThemesScreen({ navigation }: ManageThemesScreenProps) {
  const config = screenConfigs.manageThemes;
  const colors = useThemeColors();
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activating, setActivating] = useState<string | null>(null);
  const { refreshTheme } = useTheme();

  useEffect(() => {
    fetchThemes();
    return navigation.addListener('focus', () => {
      fetchThemes();
    });
  }, []);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const data = await getAllThemes();
      setThemes(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTheme = async (themeName: string) => {
    try {
      setActivating(themeName);

      await activateTheme({ themeName });

      // Actualizar lista local
      setThemes((prev) =>
        prev.map((t) => ({
          ...t,
          isActive: t.themeName === themeName ? 1 : 0
        }))
      );

      // Refrescar tema global
      await refreshTheme();

      Alert.alert('Éxito', `Tema "${themeName}" activado correctamente`);
    } catch (error) {
      showError(error);
    } finally {
      setActivating(null);
    }
  };

  const navigateToEditTheme = (themeName: string) => {
    navigation.navigate('editTheme', { themeName });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9c27b0" />
        <Text style={styles.loadingText}>Cargando temas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {themes.map((theme) => (
        <View key={theme.id} style={styles.themeCard}>
          <View style={styles.themeHeader}>
            <View style={styles.themeTitleContainer}>
              <Text style={styles.themeName}>{theme.themeName}</Text>
              {theme.isActive === 1 && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>✓ ACTIVO</Text>
                </View>
              )}
            </View>
          </View>

          {/* Preview de colores principales */}
          <View style={styles.colorPreview}>
            <View style={[styles.colorBox, { backgroundColor: theme.colors.PRIMARY }]} />
            <View style={[styles.colorBox, { backgroundColor: theme.colors.SECONDARY }]} />
            <View style={[styles.colorBox, { backgroundColor: theme.colors.SUCCESS }]} />
            <View style={[styles.colorBox, { backgroundColor: theme.colors.WARNING }]} />
            <View style={[styles.colorBox, { backgroundColor: theme.colors.INFO }]} />
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            {theme.isActive === 0 && (
              <TouchableOpacity
                style={styles.activateButton}
                onPress={() => handleActivateTheme(theme.themeName)}
                disabled={activating === theme.themeName}
              >
                {activating === theme.themeName ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.activateButtonText}>Activar</Text>
                )}
              </TouchableOpacity>
            )}
            <MyButton onPress={() => navigateToEditTheme(theme.themeName)} title="Editar Colores" />
          </View>
        </View>
      ))}

      {themes.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay temas configurados</Text>
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
  header: {
    backgroundColor: '#9c27b0',
    padding: 20,
    marginBottom: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9
  },
  themeCard: {
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
  themeHeader: {
    marginBottom: 15
  },
  themeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  themeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize'
  },
  activeBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white'
  },
  colorPreview: {
    flexDirection: 'row',
    marginBottom: 15
  },
  colorBox: {
    width: 50,
    height: 50,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10
  },
  activateButton: {
    flex: 1,
    backgroundColor: '#9c27b0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
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
