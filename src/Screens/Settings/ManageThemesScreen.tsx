import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

import { Errors } from '../../utils/Errors';
import { getAllThemes, activateTheme, deleteTheme } from '../../services/themeConfigService';
import { SettingsStackParamList } from '../../shared/types';
import { useTheme } from '~/contexts/ThemeContext';
import { ThemeConfig } from '~/shared/types/models/theme-config.type';

type ManageThemesScreenNavigationProp = StackNavigationProp<SettingsStackParamList>;
type ManageThemesScreenRouteProp = RouteProp<SettingsStackParamList>;

type ManageThemesScreenProps = {
  navigation: ManageThemesScreenNavigationProp;
  route: ManageThemesScreenRouteProp;
};

export default function ManageThemesScreen({ navigation }: ManageThemesScreenProps) {
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activating, setActivating] = useState<string | null>(null);
  const { refreshTheme, colors } = useTheme();

  useEffect(() => {
    fetchThemes();
    return navigation.addListener('focus', () => fetchThemes());
  }, []);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const data = await getAllThemes();
      setThemes(data);
    } catch (error) {
      Errors(error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTheme = async (themeName: string) => {
    try {
      setActivating(themeName);

      await activateTheme({ themeName });

      setThemes(prev =>
        prev.map(t => ({ ...t, isActive: t.themeName === themeName ? 1 : 0 }))
      );

      await refreshTheme();

      Alert.alert('Éxito', `Tema "${themeName}" activado correctamente`);
    } catch (error) {
      Errors(error);
    } finally {
      setActivating(null);
    }
  };

  const handleDeleteTheme = (themeName: string) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar el tema "${themeName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTheme(themeName);
              setThemes(prev => prev.filter(t => t.themeName !== themeName));
            } catch (error) {
              Errors(error);
            }
          },
        },
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.PRIMARY }]}
        // onPress={() => navigation.navigate('CreateThemeScreen')}
      >
        <Icon name="add" color="#fff" />
        <Text style={styles.createButtonText}>Crear nuevo tema</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {themes.map((theme) => (
          <View
            key={theme.themeName}
            style={[styles.card, { borderColor: theme.isActive ? colors.PRIMARY : colors.BORDER }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.themeName, theme.isActive ? { color: colors.PRIMARY } : {}]}>
                {theme.themeName}
              </Text>

              {theme.isActive === 1 && (
                <View style={[styles.badge, { backgroundColor: colors.SUCCESS }]}>
                  <Text style={styles.badgeText}>ACTIVO</Text>
                </View>
              )}
            </View>

            <View style={styles.buttonRow}>

              <TouchableOpacity
                style={[styles.btn, { borderColor: colors.INFO }]}
                // onPress={() => navigation.navigate('EditThemeScreen', { themeName: theme.themeName })}
              >
                <Icon name="edit" size={18} color={colors.INFO} />
                <Text style={[styles.btnText, { color: colors.INFO }]}>Editar</Text>
              </TouchableOpacity>

              {theme.isActive === 0 ? (
                <TouchableOpacity
                  style={[styles.btn, { borderColor: colors.PRIMARY }]}
                  onPress={() => handleActivateTheme(theme.themeName)}
                >
                  {activating === theme.themeName ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={18} color={colors.PRIMARY} />
                      <Text style={[styles.btnText, { color: colors.PRIMARY }]}>Activar</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.btn, { borderColor: colors.ERROR }]}
                onPress={() => handleDeleteTheme(theme.themeName)}
              >
                <Icon name="delete" size={18} color={colors.ERROR} />
                <Text style={[styles.btnText, { color: colors.ERROR }]}>Eliminar</Text>
              </TouchableOpacity>

            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  createButtonText: { color: '#fff', fontSize: 16, marginLeft: 8 },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeName: { fontSize: 18, fontWeight: 'bold' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 12 },
  buttonRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  btnText: { marginLeft: 6 },
});
