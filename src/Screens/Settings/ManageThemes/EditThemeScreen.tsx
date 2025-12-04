import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { useTheme } from '~/contexts/ThemeContext';

// Services
import { getThemeByName, updateThemeColors } from '~/services/themeConfigService';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';

// Types
import { ThemeConfig } from '~/shared/types/models/theme-config.type';
import { SettingsStackParamList } from '~/shared/types';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type EditThemeScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'editTheme'>;
type EditThemeScreenRouteProp = RouteProp<SettingsStackParamList, 'editTheme'>;

type EditThemeScreenProps = {
  navigation: EditThemeScreenNavigationProp;
  route: EditThemeScreenRouteProp;
};

export default function EditThemeScreen({ navigation, route }: EditThemeScreenProps) {
  const config = screenConfigs.graphBalances;

  const { themeName } = route.params;
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const { refreshTheme } = useTheme();

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      const data = await getThemeByName(themeName);
      setTheme(data);
      setColors(data.colors);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setColors((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateThemeColors(themeName, { colors });

      // Si es el tema activo, refrescar
      if (theme?.isActive === 1) {
        await refreshTheme();
      }

      Alert.alert('Éxito', 'Colores actualizados correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9c27b0" />
        <Text style={styles.loadingText}>Cargando tema...</Text>
      </View>
    );
  }

  if (!theme) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Tema no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Editar Tema: {theme.themeName}</Text>
        <Text style={styles.headerSubtitle}>Modifica los colores del tema</Text>
      </View>

      <View style={styles.colorsContainer}>
        {Object.entries(colors).map(([key, value]) => (
          <View key={key} style={styles.colorRow}>
            <View style={styles.colorInfo}>
              <Text style={styles.colorLabel}>{key}</Text>
              <View style={styles.colorPreview}>
                <View style={[styles.colorBox, { backgroundColor: value }]} />
                <Text style={styles.colorValue}>{value}</Text>
              </View>
            </View>
            <TextInput
              style={styles.colorInput}
              value={value}
              onChangeText={(text) => handleColorChange(key, text)}
              placeholder="#000000"
              autoCapitalize="none"
            />
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
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
  errorText: {
    fontSize: 16,
    color: '#f44336'
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
    marginBottom: 5,
    textTransform: 'capitalize'
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9
  },
  colorsContainer: {
    padding: 10
  },
  colorRow: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  colorInfo: {
    marginBottom: 10
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10
  },
  colorValue: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace'
  },
  colorInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa'
  },
  buttonContainer: {
    padding: 15,
    gap: 10,
    marginTop: 10
  },
  saveButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
