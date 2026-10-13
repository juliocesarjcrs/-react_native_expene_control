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

type EditThemeScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'editTheme'>;
type EditThemeScreenRouteProp = RouteProp<SettingsStackParamList, 'editTheme'>;

type EditThemeScreenProps = {
  navigation: EditThemeScreenNavigationProp;
  route: EditThemeScreenRouteProp;
};

export default function EditThemeScreen({ navigation, route }: EditThemeScreenProps) {
  const colors = useThemeColors();
  const { refreshTheme } = useTheme();
  const { themeName } = route.params;

  const [editedTheme, setEditedTheme] = useState<ThemeConfig | null>(null);
  const [themeColors, setThemeColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTheme = async () => {
      try {
        const data = await getThemeByName(themeName);
        if (!isMounted) return;
        setEditedTheme(data);
        setThemeColors(data.colors);
      } catch (error) {
        if (isMounted) showError(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTheme();

    return () => {
      isMounted = false;
    };
  }, [themeName]);

  const handleColorChange = (key: string, value: string) => {
    setThemeColors((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateThemeColors(themeName, { colors: themeColors });

      // Si es el tema activo, refrescar
      if (editedTheme?.isActive === 1) {
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
      <View style={[styles.centerContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
        <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>Cargando tema...</Text>
      </View>
    );
  }

  if (!editedTheme) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.BACKGROUND }]}>
        <Text style={[styles.errorText, { color: colors.ERROR }]}>Tema no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title={`Editar Tema: ${editedTheme.themeName}`}
        subtitle="Modifica los colores del tema"
      />

      <View style={styles.colorsContainer}>
        {Object.entries(themeColors).map(([key, value]) => (
          <View
            key={key}
            style={[
              styles.colorRow,
              {
                backgroundColor: colors.CARD_BACKGROUND,
                borderColor: colors.BORDER,
                shadowColor: colors.BLACK
              }
            ]}
          >
            <View style={styles.colorInfo}>
              <Text style={[styles.colorLabel, { color: colors.TEXT_PRIMARY }]}>{key}</Text>
              <View style={styles.colorPreview}>
                <View
                  style={[styles.colorBox, { backgroundColor: value, borderColor: colors.BORDER }]}
                />
                <Text style={[styles.colorValue, { color: colors.TEXT_SECONDARY }]}>{value}</Text>
              </View>
            </View>
            <TextInput
              style={[
                styles.colorInput,
                {
                  color: colors.TEXT_PRIMARY,
                  borderColor: colors.BORDER,
                  backgroundColor: colors.BACKGROUND
                }
              ]}
              value={value}
              onChangeText={(text) => handleColorChange(key, text)}
              placeholder="#000000"
              placeholderTextColor={colors.TEXT_SECONDARY}
              autoCapitalize="none"
            />
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.SUCCESS },
            saving && styles.buttonDisabled
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.WHITE} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.WHITE }]}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.ERROR }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: colors.WHITE }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16
  },
  errorText: {
    fontSize: 16
  },
  colorsContainer: {
    marginTop: 4
  },
  colorRow: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
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
    marginRight: 10
  },
  colorValue: {
    fontSize: 14,
    fontFamily: 'monospace'
  },
  colorInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  buttonContainer: {
    gap: 10,
    marginTop: 10,
    marginBottom: 20
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold'
  }
});
