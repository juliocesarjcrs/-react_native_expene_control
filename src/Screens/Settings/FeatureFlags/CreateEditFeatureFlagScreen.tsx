import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';

// Services
import { createFeature, updateFeature, getFeatureByKey } from '~/services/featureFlagsService';

// Types
import { SettingsStackParamList } from '~/shared/types';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

type CreateEditFeatureFlagScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'createEditFeatureFlag'
>;
type CreateEditFeatureFlagScreenRouteProp = RouteProp<
  SettingsStackParamList,
  'createEditFeatureFlag'
>;

interface CreateEditFeatureFlagScreenProps {
  navigation: CreateEditFeatureFlagScreenNavigationProp;
  route: CreateEditFeatureFlagScreenRouteProp;
}

type AppColors = ReturnType<typeof useThemeColors>;

interface FormData {
  featureKey: string;
  featureName: string;
  description: string;
  isEnabled: boolean;
  defaultForUsers: boolean;
  requiresRole: number | null;
  icon: string;
  category: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const DEFAULT_ICON = '⚙️';
const DEFAULT_CATEGORY = 'general';
const ADMIN_ROLE = 1;

const INITIAL_FORM: FormData = {
  featureKey: '',
  featureName: '',
  description: '',
  isEnabled: true,
  defaultForUsers: true,
  requiresRole: null,
  icon: DEFAULT_ICON,
  category: DEFAULT_CATEGORY
};

const ICON_OPTIONS = [
  '⚙️',
  '🤖',
  '📄',
  '📊',
  '💰',
  '📈',
  '🔔',
  '🎨',
  '🔒',
  '👥',
  '📱',
  '💡',
  '🚀',
  '⭐',
  '🎯',
  '📝'
];

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'ai', label: 'Inteligencia Artificial' },
  { value: 'reports', label: 'Reportes' },
  { value: 'tools', label: 'Herramientas' },
  { value: 'security', label: 'Seguridad' },
  { value: 'analytics', label: 'Análisis' },
  { value: 'notifications', label: 'Notificaciones' }
];

export default function CreateEditFeatureFlagScreen({
  navigation,
  route
}: CreateEditFeatureFlagScreenProps) {
  const colors = useThemeColors();

  // Parámetros de navegación (derivan el modo, no hace falta estado)
  const featureKey = route.params?.featureKey;
  const isEditMode = Boolean(featureKey);
  const originalKey = featureKey ?? '';

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(isEditMode); // carga inicial
  const [saving, setSaving] = useState<boolean>(false); // envío del formulario

  useEffect(() => {
    let isMounted = true;

    const loadFeature = async (key: string) => {
      try {
        const feature = await getFeatureByKey(key);
        if (!isMounted) return;

        setFormData({
          featureKey: feature.featureKey,
          featureName: feature.featureName,
          description: feature.description || '',
          isEnabled: feature.isEnabled === 1,
          defaultForUsers: feature.defaultForUsers === 1,
          requiresRole: feature.requiresRole,
          icon: feature.metadata?.icon || DEFAULT_ICON,
          category: feature.metadata?.category || DEFAULT_CATEGORY
        });
      } catch (error) {
        if (isMounted) {
          showError(error);
          navigation.goBack();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (featureKey) loadFeature(featureKey);

    return () => {
      isMounted = false;
    };
  }, [featureKey, navigation]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al editar
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Feature Key (solo requerido en modo creación)
    if (!isEditMode && !formData.featureKey.trim()) {
      newErrors.featureKey = 'El key es obligatorio';
    } else if (!isEditMode && !/^[a-z_]+$/.test(formData.featureKey)) {
      newErrors.featureKey = 'Solo minúsculas y guiones bajos (ej: chatbot, invoice_scanner)';
    }

    // Feature Name
    if (!formData.featureName.trim()) {
      newErrors.featureName = 'El nombre es obligatorio';
    }

    // Description
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores del formulario');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        featureKey: formData.featureKey,
        featureName: formData.featureName,
        description: formData.description,
        isEnabled: formData.isEnabled,
        defaultForUsers: formData.defaultForUsers,
        requiresRole: formData.requiresRole,
        metadata: {
          icon: formData.icon,
          category: formData.category
        }
      };

      if (isEditMode) {
        await updateFeature(originalKey, payload);
      } else {
        await createFeature(payload);
      }

      Alert.alert('Éxito', `Funcionalidad ${isEditMode ? 'actualizada' : 'creada'} correctamente`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
        <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>
          Cargando funcionalidad...
        </Text>
      </View>
    );
  }

  const inputTheme = {
    color: colors.TEXT_PRIMARY,
    backgroundColor: colors.CARD_BACKGROUND,
    borderColor: colors.BORDER
  };
  const inputErrorTheme = { borderColor: colors.ERROR };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={isEditMode ? 'Editar Funcionalidad' : 'Nueva Funcionalidad'}
          subtitle={
            isEditMode ? 'Modifica la configuración de la feature' : 'Crea una nueva feature flag'
          }
        />

        <View style={styles.formContainer}>
          {/* Feature Key (solo en modo creación) */}
          {!isEditMode && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
                Feature Key <Text style={{ color: colors.ERROR }}>*</Text>
              </Text>
              <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
                Identificador único (solo minúsculas y guiones bajos)
              </Text>
              <TextInput
                style={[styles.input, inputTheme, !!errors.featureKey && inputErrorTheme]}
                value={formData.featureKey}
                onChangeText={(text) => updateField('featureKey', text.toLowerCase())}
                placeholder="ej: chatbot, invoice_scanner"
                placeholderTextColor={colors.TEXT_SECONDARY}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!errors.featureKey && (
                <Text style={[styles.errorText, { color: colors.ERROR }]}>{errors.featureKey}</Text>
              )}
            </View>
          )}

          {/* Feature Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
              Nombre <Text style={{ color: colors.ERROR }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, inputTheme, !!errors.featureName && inputErrorTheme]}
              value={formData.featureName}
              onChangeText={(text) => updateField('featureName', text)}
              placeholder="ej: Chatbot AI, Escanear Facturas"
              placeholderTextColor={colors.TEXT_SECONDARY}
            />
            {!!errors.featureName && (
              <Text style={[styles.errorText, { color: colors.ERROR }]}>{errors.featureName}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
              Descripción <Text style={{ color: colors.ERROR }}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, inputTheme, !!errors.description && inputErrorTheme]}
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Describe qué hace esta funcionalidad..."
              placeholderTextColor={colors.TEXT_SECONDARY}
              multiline
              numberOfLines={4}
            />
            {!!errors.description && (
              <Text style={[styles.errorText, { color: colors.ERROR }]}>{errors.description}</Text>
            )}
          </View>

          {/* Icon Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Icono</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconSelector}
            >
              {ICON_OPTIONS.map((icon) => {
                const selected = formData.icon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: selected ? colors.PRIMARY + '15' : colors.CARD_BACKGROUND,
                        borderColor: selected ? colors.PRIMARY : colors.BORDER
                      }
                    ]}
                    onPress={() => updateField('icon', icon)}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Categoría</Text>
            <View style={styles.categoryContainer}>
              {CATEGORY_OPTIONS.map((category) => {
                const selected = formData.category === category.value;
                return (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selected ? colors.PRIMARY : colors.CARD_BACKGROUND,
                        borderColor: selected ? colors.PRIMARY : colors.BORDER
                      }
                    ]}
                    onPress={() => updateField('category', category.value)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: selected ? colors.WHITE : colors.TEXT_SECONDARY },
                        selected && styles.categoryChipTextSelected
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />

          {/* Switches Section */}
          <View style={styles.formGroup}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
              Configuración de Acceso
            </Text>

            <SwitchRow
              label="Funcionalidad Habilitada"
              hint="Si está deshabilitada, nadie podrá usarla"
              value={formData.isEnabled}
              onValueChange={(value) => updateField('isEnabled', value)}
              colors={colors}
            />

            <SwitchRow
              label="Habilitada por Defecto"
              hint={
                formData.defaultForUsers
                  ? 'Todos los usuarios pueden usarla (se puede denegar individualmente)'
                  : 'Solo usuarios con permiso explícito pueden usarla'
              }
              value={formData.defaultForUsers}
              onValueChange={(value) => updateField('defaultForUsers', value)}
              colors={colors}
            />

            <SwitchRow
              label="Solo Administradores"
              hint="Restringir acceso solo a usuarios con rol de administrador"
              value={formData.requiresRole === ADMIN_ROLE}
              onValueChange={(value) => updateField('requiresRole', value ? ADMIN_ROLE : null)}
              colors={colors}
            />
          </View>

          {/* Info Box */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.INFO + '15', borderLeftColor: colors.INFO }
            ]}
          >
            <Text style={styles.infoIcon}>💡</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.INFO }]}>Flujo de Permisos:</Text>
              <Text style={[styles.infoText, { color: colors.TEXT_PRIMARY }]}>
                1. ¿Está habilitada? → Si NO, nadie puede acceder{'\n'}
                2. ¿Requiere admin? → Solo admins{'\n'}
                3. ¿Usuario tiene permiso específico? → Usar ese permiso{'\n'}
                4. Si no → Usar &quot;Habilitada por Defecto&quot;
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }
              ]}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={[styles.cancelButtonText, { color: colors.TEXT_SECONDARY }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.PRIMARY },
                saving && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.WHITE} />
              ) : (
                <Text style={[styles.submitButtonText, { color: colors.WHITE }]}>
                  {isEditMode ? 'Actualizar' : 'Crear'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// Componente: Fila con Switch
// ============================================================================

interface SwitchRowProps {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: AppColors;
}

const SwitchRow: React.FC<SwitchRowProps> = ({ label, hint, value, onValueChange, colors }) => (
  <View style={[styles.switchRow, { backgroundColor: colors.CARD_BACKGROUND }]}>
    <View style={styles.switchInfo}>
      <Text style={[styles.switchLabel, { color: colors.TEXT_PRIMARY }]}>{label}</Text>
      <Text style={[styles.switchHint, { color: colors.TEXT_SECONDARY }]}>{hint}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.GRAY, true: colors.PRIMARY }}
      thumbColor={value ? colors.PRIMARY : colors.LIGHT_GRAY}
    />
  </View>
);

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center'
  },
  formContainer: {
    marginTop: 4
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5
  },
  hint: {
    fontSize: 12,
    marginBottom: 8
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  errorText: {
    fontSize: 12,
    marginTop: 5
  },
  iconSelector: {
    marginTop: 10
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2
  },
  iconText: {
    fontSize: 28
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  categoryChipText: {
    fontSize: 14
  },
  categoryChipTextSelected: {
    fontWeight: '600'
  },
  divider: {
    height: 1,
    marginVertical: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  switchInfo: {
    flex: 1,
    marginRight: 15
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  switchHint: {
    fontSize: 13,
    lineHeight: 18
  },
  infoBox: {
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    marginVertical: 20,
    borderLeftWidth: 4
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 10
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 30
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  submitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});
