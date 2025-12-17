import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';
import ColorPicker from 'react-native-wheel-color-picker';

// Services
import { getMyTheme, setCustomColors } from '~/services/UserThemePreferenceService';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';

// Types
import { SettingsStackParamList } from '~/shared/types';
import { ThemeColors } from '~/shared/types/services/theme-config-service.type';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type CustomizeThemeColorsScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'customizeThemeColors'
>;

interface CustomizeThemeColorsScreenProps {
  navigation: CustomizeThemeColorsScreenNavigationProp;
}

type ColorKey = keyof ThemeColors;

interface ColorConfig {
  key: ColorKey;
  label: string;
  icon: string;
  description: string;
}

const COLOR_CONFIGS: ColorConfig[] = [
  {
    key: 'PRIMARY',
    label: 'Color Primario',
    icon: 'palette',
    description: 'Color principal de la app'
  },
  {
    key: 'SECONDARY',
    label: 'Color Secundario',
    icon: 'palette-outline',
    description: 'Color complementario'
  },
  {
    key: 'SUCCESS',
    label: 'Éxito',
    icon: 'check-circle',
    description: 'Ingresos y acciones positivas'
  },
  { key: 'WARNING', label: 'Advertencia', icon: 'alert', description: 'Gastos y alertas' },
  {
    key: 'ERROR',
    label: 'Error',
    icon: 'close-circle',
    description: 'Errores y acciones destructivas'
  },
  {
    key: 'INFO',
    label: 'Información',
    icon: 'information',
    description: 'Editar y acciones informativas'
  },
  {
    key: 'BACKGROUND',
    label: 'Fondo',
    icon: 'texture-box',
    description: 'Fondo principal de la app'
  },
  {
    key: 'CARD_BACKGROUND',
    label: 'Fondo de Tarjetas',
    icon: 'card-outline',
    description: 'Fondo de cards y componentes'
  },
  {
    key: 'TEXT_PRIMARY',
    label: 'Texto Principal',
    icon: 'format-text',
    description: 'Color de texto principal'
  },
  {
    key: 'TEXT_SECONDARY',
    label: 'Texto Secundario',
    icon: 'format-color-text',
    description: 'Color de texto secundario'
  },
  {
    key: 'BORDER',
    label: 'Bordes',
    icon: 'border-all',
    description: 'Color de bordes y separadores'
  }
];

export default function CustomizeThemeColorsScreen({
  navigation
}: CustomizeThemeColorsScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.customizeThemeColors;

  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [colorValues, setColorValues] = useState<Partial<ThemeColors>>({});
  const [selectedColorKey, setSelectedColorKey] = useState<ColorKey | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);

  useEffect(() => {
    fetchCurrentColors();
  }, []);

  const fetchCurrentColors = async (): Promise<void> => {
    try {
      setLoading(true);
      const theme = await getMyTheme();
      setColorValues(theme.colors);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorSelect = (colorKey: ColorKey): void => {
    setSelectedColorKey(colorKey);
    setShowPicker(true);
  };

  const handleColorChange = (color: string): void => {
    if (selectedColorKey) {
      setColorValues((prev) => ({
        ...prev,
        [selectedColorKey]: color
      }));
    }
  };

  const handleSaveColors = async (): Promise<void> => {
    try {
      setSaving(true);
      // await setColorValues({ customColors: colorValues });
      await setCustomColors({ customColors: colorValues });
      ShowToast('Colores personalizados guardados');

      // Esperar un momento para que se vea el cambio
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetColors = (): void => {
    Alert.alert('Resetear colores', '¿Deseas restaurar los colores originales?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resetear',
        style: 'destructive',
        onPress: () => {
          fetchCurrentColors();
          ShowToast('Colores restaurados');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />
        <MyLoading />
      </View>
    );
  }

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Instrucciones */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.INFO + '15',
                borderLeftColor: colors.INFO
              }
            ]}
          >
            <Icon
              type="material-community"
              name="information"
              size={20}
              color={colors.INFO}
              containerStyle={{ marginRight: 12 }}
            />
            <Text style={[styles.infoText, { color: colors.TEXT_PRIMARY }]}>
              Toca cualquier color para personalizarlo. Los cambios se aplicarán inmediatamente al
              guardar.
            </Text>
          </View>

          {/* Lista de colores editables */}
          {COLOR_CONFIGS.map((config) => (
            <ColorEditCard
              key={config.key}
              config={config}
              currentColor={colorValues[config.key] || colors[config.key]}
              onPress={() => handleColorSelect(config.key)}
              colors={colors}
            />
          ))}

          {/* Color Picker Modal */}
          {showPicker && selectedColorKey && (
            <View style={styles.pickerContainer}>
              <View
                style={[
                  styles.pickerCard,
                  {
                    backgroundColor: colors.CARD_BACKGROUND,
                    borderColor: colors.BORDER
                  }
                ]}
              >
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: colors.TEXT_PRIMARY }]}>
                    {COLOR_CONFIGS.find((c) => c.key === selectedColorKey)?.label}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPicker(false)}
                    style={[styles.closeButton, { backgroundColor: colors.GRAY + '20' }]}
                    activeOpacity={0.7}
                  >
                    <Icon
                      type="material-community"
                      name="close"
                      size={20}
                      color={colors.TEXT_PRIMARY}
                    />
                  </TouchableOpacity>
                </View>

                <ColorPicker
                  color={colorValues[selectedColorKey] || colors[selectedColorKey]}
                  onColorChange={handleColorChange}
                  thumbSize={30}
                  sliderSize={30}
                  noSnap={true}
                  row={false}
                  swatches={true}
                  discrete={false}
                />
              </View>
            </View>
          )}

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <MyButton
                  title="Resetear"
                  onPress={handleResetColors}
                  variant="cancel"
                  icon={
                    <Icon type="material-community" name="restore" size={20} color={colors.GRAY} />
                  }
                  disabled={saving}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <MyButton
                  title="Guardar"
                  onPress={handleSaveColors}
                  variant="success"
                  icon={
                    <Icon type="material-community" name="content-save" size={20} color="#fff" />
                  }
                  disabled={saving}
                  loading={saving}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Componente: Card de Color Editable
// ============================================================================

interface ColorEditCardProps {
  config: ColorConfig;
  currentColor: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

const ColorEditCard: React.FC<ColorEditCardProps> = ({ config, currentColor, onPress, colors }) => {
  return (
    <View
      style={[
        styles.colorCard,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER
        }
      ]}
    >
      <View style={styles.colorCardContent}>
        <View style={[styles.colorIconContainer, { backgroundColor: currentColor + '15' }]}>
          <Icon type="material-community" name={config.icon} size={24} color={currentColor} />
        </View>
        <View style={styles.colorInfo}>
          <Text style={[styles.colorLabel, { color: colors.TEXT_PRIMARY }]}>{config.label}</Text>
          <Text style={[styles.colorDescription, { color: colors.TEXT_SECONDARY }]}>
            {config.description}
          </Text>
        </View>
        <View style={styles.colorPreviewContainer}>
          <View style={[styles.colorPreviewCircle, { backgroundColor: currentColor }]} />
          <Text style={[styles.colorHex, { color: colors.TEXT_SECONDARY }]}>{currentColor}</Text>
        </View>
      </View>
      <MyButton
        title="Editar"
        onPress={onPress}
        variant="secondary"
        icon={<Icon type="material-community" name="pencil" size={18} color="#fff" />}
        size="small"
      />
    </View>
  );
};

// ============================================================================
// Estilos
// ============================================================================

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3
  },
  infoText: {
    flex: 1,
    fontSize: SMALL + 1,
    lineHeight: 20
  },
  colorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  colorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  colorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  colorInfo: {
    flex: 1
  },
  colorLabel: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 2
  },
  colorDescription: {
    fontSize: SMALL
  },
  colorPreviewContainer: {
    alignItems: 'center',
    marginLeft: 8
  },
  colorPreviewCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  colorHex: {
    fontSize: SMALL - 2
  },
  pickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 16
  },
  pickerCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  pickerTitle: {
    fontSize: MEDIUM + 2,
    fontWeight: '600'
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  colorPicker: {
    width: '100%'
  },
  preview: {
    height: 60,
    marginBottom: 20,
    borderRadius: 8
  },
  panel: {
    height: 200,
    marginBottom: 20,
    borderRadius: 8
  },
  slider: {
    height: 40,
    marginBottom: 20,
    borderRadius: 8
  },
  swatches: {
    marginTop: 10
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});
