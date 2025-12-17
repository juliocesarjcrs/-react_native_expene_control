import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';

// Services
import {
  getAvailableThemes,
  getMyTheme,
  resetThemeToGlobal,
  selectTheme
} from '~/services/UserThemePreferenceService';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';

// Types
import { SettingsStackParamList } from '~/shared/types';
import { ThemeConfig } from '~/shared/types/models/theme-config.type';
import { UserThemeConfig } from '~/shared/types/services/user-theme-preference-service.type';

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
import { useTheme } from '~/contexts/ThemeContext';

type UserThemeSettingsScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'userThemeSettings'
>;

interface UserThemeSettingsScreenProps {
  navigation: UserThemeSettingsScreenNavigationProp;
}

export default function UserThemeSettingsScreen({ navigation }: UserThemeSettingsScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.userThemeSettings;
  const { refreshTheme } = useTheme();

  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<UserThemeConfig | null>(null);
  const [availableThemes, setAvailableThemes] = useState<ThemeConfig[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [myTheme, themes] = await Promise.all([getMyTheme(), getAvailableThemes()]);
      setCurrentTheme(myTheme);
      setAvailableThemes(themes);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTheme = async (themeId: number): Promise<void> => {
    try {
      setRefreshing(true);
      const response = await selectTheme({ themeId });
      setCurrentTheme(response.theme);
      ShowToast('Tema aplicado exitosamente');

      // Recargar el tema en toda la app
      await refreshTheme();

      ShowToast('Tema aplicado exitosamente');
      setRefreshing(false);
    } catch (error) {
      setRefreshing(false);
      showError(error);
    }
  };

  const handleResetTheme = (): void => {
    Alert.alert(
      'Resetear tema',
      '¿Deseas volver al tema global? Se eliminarán todas tus personalizaciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            try {
              setRefreshing(true);
              const response = await resetThemeToGlobal();
              setCurrentTheme(response.theme);
              ShowToast('Tema reseteado al global');
              setTimeout(() => {
                setRefreshing(false);
              }, 500);
            } catch (error) {
              setRefreshing(false);
              showError(error);
            }
          }
        }
      ]
    );
  };

  const handleCustomizeColors = (): void => {
    navigation.navigate('customizeThemeColors');
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
          {/* Tema Actual */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>Tema Actual</Text>
            {currentTheme && <CurrentThemeCard theme={currentTheme} colors={colors} />}
          </View>

          {/* Temas Disponibles */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
              Temas Disponibles
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.TEXT_SECONDARY }]}>
              Selecciona uno de los temas predefinidos
            </Text>
            {availableThemes.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon
                  type="material-community"
                  name="palette-outline"
                  size={48}
                  color={colors.TEXT_SECONDARY}
                />
                <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                  No hay temas disponibles
                </Text>
              </View>
            ) : (
              availableThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  colors={colors}
                  isActive={currentTheme?.themeId === theme.id && !currentTheme?.isCustom}
                  onPress={() => handleSelectTheme(theme.id)}
                  disabled={refreshing}
                />
              ))
            )}
          </View>

          {/* Personalización */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
              Personalización
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.TEXT_SECONDARY }]}>
              Crea tu propio tema con colores personalizados
            </Text>
            <MyButton
              title="Personalizar Colores"
              onPress={handleCustomizeColors}
              variant="primary"
              icon={<Icon type="material-community" name="palette" size={20} color="#fff" />}
              disabled={refreshing}
            />
          </View>

          {/* Resetear */}
          {currentTheme && (currentTheme.isCustom || currentTheme.themeId !== null) && (
            <View style={styles.sectionContainer}>
              <MyButton
                title="Resetear a Tema Global"
                onPress={handleResetTheme}
                variant="cancel"
                icon={
                  <Icon type="material-community" name="restore" size={20} color={colors.GRAY} />
                }
                disabled={refreshing}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Componente: Card del Tema Actual
// ============================================================================

interface CurrentThemeCardProps {
  theme: UserThemeConfig;
  colors: ReturnType<typeof useThemeColors>;
}

const CurrentThemeCard: React.FC<CurrentThemeCardProps> = ({ theme, colors }) => {
  return (
    <View
      style={[
        styles.currentThemeCard,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER
        }
      ]}
    >
      <View style={styles.currentThemeHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
          <Icon
            type="material-community"
            name={theme.isCustom ? 'palette' : 'palette-outline'}
            size={24}
            color={colors.PRIMARY}
          />
        </View>
        <View style={styles.currentThemeInfo}>
          <Text style={[styles.currentThemeName, { color: colors.TEXT_PRIMARY }]}>
            {theme.isCustom ? 'Tema Personalizado' : theme.themeName}
          </Text>
          <Text style={[styles.currentThemeType, { color: colors.TEXT_SECONDARY }]}>
            {theme.isCustom ? 'Colores personalizados' : 'Tema predefinido'}
          </Text>
        </View>
        {theme.isCustom && (
          <View style={[styles.badge, { backgroundColor: colors.PRIMARY + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.PRIMARY }]}>Custom</Text>
          </View>
        )}
      </View>

      {/* Preview de colores */}
      <View style={styles.colorPreviewContainer}>
        <ColorPreview
          label="Primary"
          color={theme.colors.PRIMARY}
          textColor={colors.TEXT_SECONDARY}
        />
        <ColorPreview
          label="Secondary"
          color={theme.colors.SECONDARY}
          textColor={colors.TEXT_SECONDARY}
        />
        <ColorPreview
          label="Success"
          color={theme.colors.SUCCESS}
          textColor={colors.TEXT_SECONDARY}
        />
        <ColorPreview label="Error" color={theme.colors.ERROR} textColor={colors.TEXT_SECONDARY} />
      </View>
    </View>
  );
};

// ============================================================================
// Componente: Card de Tema Disponible
// ============================================================================

interface ThemeCardProps {
  theme: ThemeConfig;
  colors: ReturnType<typeof useThemeColors>;
  isActive: boolean;
  onPress: () => void;
  disabled: boolean;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, colors, isActive, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={[
        styles.themeCard,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: isActive ? colors.PRIMARY : colors.BORDER,
          borderWidth: isActive ? 2 : 1
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.themeCardHeader}>
        <View style={styles.themeCardInfo}>
          <Text style={[styles.themeCardName, { color: colors.TEXT_PRIMARY }]}>
            {theme.themeName}
          </Text>
          {/* Descripción opcional - puedes eliminar esta línea si no la necesitas */}
        </View>
        {isActive && (
          <Icon type="material-community" name="check-circle" size={24} color={colors.PRIMARY} />
        )}
      </View>

      {/* Preview de colores del tema */}
      <View style={styles.colorPreviewContainer}>
        <ColorPreview
          label="Primary"
          color={theme.colors.PRIMARY}
          textColor={colors.TEXT_SECONDARY}
        />
        <ColorPreview
          label="Secondary"
          color={theme.colors.SECONDARY}
          textColor={colors.TEXT_SECONDARY}
        />
        <ColorPreview
          label="Success"
          color={theme.colors.SUCCESS}
          textColor={colors.TEXT_SECONDARY}
        />
        <ColorPreview label="Error" color={theme.colors.ERROR} textColor={colors.TEXT_SECONDARY} />
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Componente: Preview de Color
// ============================================================================

interface ColorPreviewProps {
  label: string;
  color: string;
  textColor: string;
}

const ColorPreview: React.FC<ColorPreviewProps> = ({ label, color, textColor }) => {
  return (
    <View style={styles.colorPreview}>
      <View style={[styles.colorCircle, { backgroundColor: color }]} />
      <Text style={[styles.colorLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
};

// ============================================================================
// Estilos
// ============================================================================

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: MEDIUM + 2,
    fontWeight: '600',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: SMALL + 1,
    marginBottom: 12
  },
  currentThemeCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  currentThemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  currentThemeInfo: {
    flex: 1
  },
  currentThemeName: {
    fontSize: MEDIUM + 1,
    fontWeight: '600',
    marginBottom: 2
  },
  currentThemeType: {
    fontSize: SMALL
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  },
  themeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  themeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  themeCardInfo: {
    flex: 1,
    marginRight: 8
  },
  themeCardName: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 4
  },
  themeCardDescription: {
    fontSize: SMALL
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  colorPreview: {
    alignItems: 'center',
    minWidth: 60
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  colorLabel: {
    fontSize: SMALL - 1
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: SMALL + 1,
    marginTop: 12
  }
});
