import React, { useState, useEffect } from 'react';
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
import { FeatureFlag } from '~/shared/types/models/feature-flags.type';
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

const INITIAL_FORM: FormData = {
  featureKey: '',
  featureName: '',
  description: '',
  isEnabled: true,
  defaultForUsers: true,
  requiresRole: null,
  icon: '⚙️',
  category: 'general'
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
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [originalKey, setOriginalKey] = useState<string>('');

  // Parámetros de navegación
  const featureKey = route.params?.featureKey;

  useEffect(() => {
    if (featureKey) {
      setIsEditMode(true);
      setOriginalKey(featureKey);
      loadFeature(featureKey);
    }
  }, [featureKey]);

  const loadFeature = async (key: string) => {
    try {
      setLoading(true);
      const feature = await getFeatureByKey(key);

      setFormData({
        featureKey: feature.featureKey,
        featureName: feature.featureName,
        description: feature.description || '',
        isEnabled: feature.isEnabled === 1,
        defaultForUsers: feature.defaultForUsers === 1,
        requiresRole: feature.requiresRole,
        icon: feature.metadata?.icon || '⚙️',
        category: feature.metadata?.category || 'general'
      });
    } catch (error) {
      showError(error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

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
      setLoading(true);

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
        Alert.alert('Éxito', 'Funcionalidad actualizada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createFeature(payload);
        Alert.alert('Éxito', 'Funcionalidad creada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color="#9c27b0" />
        <Text style={styles.loadingText}>Cargando funcionalidad...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
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
              <Text style={styles.label}>
                Feature Key <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.hint}>Identificador único (solo minúsculas y guiones bajos)</Text>
              <TextInput
                style={[styles.input, errors.featureKey && styles.inputError]}
                value={formData.featureKey}
                onChangeText={(text) => updateField('featureKey', text.toLowerCase())}
                placeholder="ej: chatbot, invoice_scanner"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.featureKey && <Text style={styles.errorText}>{errors.featureKey}</Text>}
            </View>
          )}

          {/* Feature Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Nombre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.featureName && styles.inputError]}
              value={formData.featureName}
              onChangeText={(text) => updateField('featureName', text)}
              placeholder="ej: Chatbot AI, Escanear Facturas"
              placeholderTextColor="#999"
            />
            {errors.featureName && <Text style={styles.errorText}>{errors.featureName}</Text>}
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Descripción <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Describe qué hace esta funcionalidad..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Icon Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Icono</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconSelector}
            >
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, formData.icon === icon && styles.iconOptionSelected]}
                  onPress={() => updateField('icon', icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoryContainer}>
              {CATEGORY_OPTIONS.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryChip,
                    formData.category === category.value && styles.categoryChipSelected
                  ]}
                  onPress={() => updateField('category', category.value)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      formData.category === category.value && styles.categoryChipTextSelected
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Switches Section */}
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Configuración de Acceso</Text>

            {/* Is Enabled */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Funcionalidad Habilitada</Text>
                <Text style={styles.switchHint}>Si está deshabilitada, nadie podrá usarla</Text>
              </View>
              <Switch
                value={formData.isEnabled}
                onValueChange={(value) => updateField('isEnabled', value)}
                trackColor={{ false: '#d3d3d3', true: '#9c27b0' }}
                thumbColor={formData.isEnabled ? '#6d1b7b' : '#f4f3f4'}
              />
            </View>

            {/* Default For Users */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Habilitada por Defecto</Text>
                <Text style={styles.switchHint}>
                  {formData.defaultForUsers
                    ? 'Todos los usuarios pueden usarla (se puede denegar individualmente)'
                    : 'Solo usuarios con permiso explícito pueden usarla'}
                </Text>
              </View>
              <Switch
                value={formData.defaultForUsers}
                onValueChange={(value) => updateField('defaultForUsers', value)}
                trackColor={{ false: '#d3d3d3', true: '#9c27b0' }}
                thumbColor={formData.defaultForUsers ? '#6d1b7b' : '#f4f3f4'}
              />
            </View>

            {/* Requires Role */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Solo Administradores</Text>
                <Text style={styles.switchHint}>
                  Restringir acceso solo a usuarios con rol de administrador
                </Text>
              </View>
              <Switch
                value={formData.requiresRole === 1}
                onValueChange={(value) => updateField('requiresRole', value ? 1 : null)}
                trackColor={{ false: '#d3d3d3', true: '#9c27b0' }}
                thumbColor={formData.requiresRole === 1 ? '#6d1b7b' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Flujo de Permisos:</Text>
              <Text style={styles.infoText}>
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
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>{isEditMode ? 'Actualizar' : 'Crear'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    color: '#666',
    textAlign: 'center'
  },
  formContainer: {
    padding: 15
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5
  },
  required: {
    color: '#e53935'
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  inputError: {
    borderColor: '#e53935'
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
    textAlignVertical: 'top'
  },
  errorText: {
    color: '#e53935',
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
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#ddd'
  },
  iconOptionSelected: {
    borderColor: '#9c27b0',
    backgroundColor: '#f3e5f5'
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  categoryChipSelected: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0'
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666'
  },
  categoryChipTextSelected: {
    color: 'white',
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
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
    color: '#333',
    marginBottom: 4
  },
  switchHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    marginVertical: 20,
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
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5
  },
  infoText: {
    fontSize: 13,
    color: '#1565c0',
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
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#9c27b0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: '#ce93d8'
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
