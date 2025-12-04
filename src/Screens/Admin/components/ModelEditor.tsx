import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyButton from '~/components/MyButton';
import { AIModel } from '~/shared/types/models/ai-model.type';
import { createModel, updateModel } from '~/services/aiConfigService';
import { showError } from '~/utils/showError';

interface ModelEditorProps {
  visible: boolean;
  model: AIModel | null;
  onClose: (reload?: boolean) => void;
}

export const ModelEditor: React.FC<ModelEditorProps> = ({ visible, model, onClose }) => {
  const colors = useThemeColors();
  const isEditing = !!model;

  const [formData, setFormData] = useState({
    provider_type: 'openrouter' as 'openrouter' | 'openai' | 'custom',
    model_name: '',
    api_endpoint: '',
    api_key_ref: '',
    priority: 1,
    is_active: true,
    max_tokens: 2000,
    temperature: 0.7,
    supports_tools: true
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData({
        provider_type: model.provider_type,
        model_name: model.model_name,
        api_endpoint: model.api_endpoint,
        api_key_ref: model.api_key_ref,
        priority: model.priority,
        is_active: model.is_active,
        max_tokens: model.max_tokens,
        temperature: model.temperature,
        supports_tools: model.supports_tools
      });
    } else {
      // Reset form
      setFormData({
        provider_type: 'openrouter',
        model_name: '',
        api_endpoint: '',
        api_key_ref: '',
        priority: 1,
        is_active: true,
        max_tokens: 2000,
        temperature: 0.7,
        supports_tools: true
      });
    }
  }, [model, visible]);

  const handleSave = async () => {
    // Validaciones
    if (!formData.model_name.trim()) {
      Alert.alert('Error', 'El nombre del modelo es requerido');
      return;
    }
    if (!formData.api_endpoint.trim()) {
      Alert.alert('Error', 'El endpoint es requerido');
      return;
    }
    if (!formData.api_key_ref.trim()) {
      Alert.alert('Error', 'La referencia de API key es requerida');
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await updateModel(model.id, formData);
        Alert.alert('Éxito', 'Modelo actualizado correctamente');
      } else {
        await createModel(formData);
        Alert.alert('Éxito', 'Modelo creado correctamente');
      }

      onClose(true);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onClose(false)}
    >
      <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.CARD_BACKGROUND, borderBottomColor: colors.BORDER }
          ]}
        >
          <TouchableOpacity onPress={() => onClose(false)}>
            <Icon name="close" type="material-community" size={24} color={colors.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT_PRIMARY }]}>
            {isEditing ? 'Editar Modelo' : 'Nuevo Modelo'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form */}
        <ScrollView style={styles.form}>
          {/* Provider Type */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Proveedor *</Text>
            <View style={styles.providerButtons}>
              {(['openrouter', 'openai', 'custom'] as const).map((provider) => (
                <TouchableOpacity
                  key={provider}
                  style={[
                    styles.providerButton,
                    {
                      backgroundColor:
                        formData.provider_type === provider
                          ? colors.PRIMARY
                          : colors.CARD_BACKGROUND,
                      borderColor: colors.BORDER
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, provider_type: provider })}
                >
                  <Text
                    style={[
                      styles.providerButtonText,
                      {
                        color: formData.provider_type === provider ? '#fff' : colors.TEXT_PRIMARY
                      }
                    ]}
                  >
                    {provider}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Model Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Nombre del Modelo *</Text>
            <TextInput
              value={formData.model_name}
              onChangeText={(text) => setFormData({ ...formData, model_name: text })}
              placeholder="ej: meta-llama/llama-3.1-8b-instruct"
              placeholderTextColor={colors.TEXT_SECONDARY}
              style={[
                styles.input,
                {
                  backgroundColor: colors.CARD_BACKGROUND,
                  color: colors.TEXT_PRIMARY,
                  borderColor: colors.BORDER
                }
              ]}
            />
          </View>

          {/* API Endpoint */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>API Endpoint *</Text>
            <TextInput
              value={formData.api_endpoint}
              onChangeText={(text) => setFormData({ ...formData, api_endpoint: text })}
              placeholder="ej: https://openrouter.ai/api/v1/chat/completions"
              placeholderTextColor={colors.TEXT_SECONDARY}
              style={[
                styles.input,
                {
                  backgroundColor: colors.CARD_BACKGROUND,
                  color: colors.TEXT_PRIMARY,
                  borderColor: colors.BORDER
                }
              ]}
              autoCapitalize="none"
            />
          </View>

          {/* API Key Reference */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Referencia API Key *</Text>
            <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
              Nombre de la variable de entorno (ej: OPENROUTER_API_KEY)
            </Text>
            <TextInput
              value={formData.api_key_ref}
              onChangeText={(text) => setFormData({ ...formData, api_key_ref: text })}
              placeholder="OPENROUTER_API_KEY"
              placeholderTextColor={colors.TEXT_SECONDARY}
              style={[
                styles.input,
                {
                  backgroundColor: colors.CARD_BACKGROUND,
                  color: colors.TEXT_PRIMARY,
                  borderColor: colors.BORDER
                }
              ]}
              autoCapitalize="characters"
            />
          </View>

          {/* Priority */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Prioridad</Text>
            <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
              Menor número = mayor prioridad (1 es la más alta)
            </Text>
            <TextInput
              value={formData.priority.toString()}
              onChangeText={(text) => setFormData({ ...formData, priority: parseInt(text) || 1 })}
              keyboardType="number-pad"
              style={[
                styles.input,
                {
                  backgroundColor: colors.CARD_BACKGROUND,
                  color: colors.TEXT_PRIMARY,
                  borderColor: colors.BORDER
                }
              ]}
            />
          </View>

          {/* Max Tokens */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Max Tokens</Text>
            <TextInput
              value={formData.max_tokens.toString()}
              onChangeText={(text) =>
                setFormData({ ...formData, max_tokens: parseInt(text) || 2000 })
              }
              keyboardType="number-pad"
              style={[
                styles.input,
                {
                  backgroundColor: colors.CARD_BACKGROUND,
                  color: colors.TEXT_PRIMARY,
                  borderColor: colors.BORDER
                }
              ]}
            />
          </View>

          {/* Temperature */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
              Temperature: {formData.temperature.toFixed(2)}
            </Text>
            <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
              0 = determinista, 2 = muy creativo
            </Text>
            <TextInput
              value={formData.temperature.toString()}
              onChangeText={(text) => {
                const val = parseFloat(text) || 0;
                setFormData({ ...formData, temperature: Math.min(2, Math.max(0, val)) });
              }}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                {
                  backgroundColor: colors.CARD_BACKGROUND,
                  color: colors.TEXT_PRIMARY,
                  borderColor: colors.BORDER
                }
              ]}
            />
          </View>

          {/* Switches */}
          <View style={[styles.switchRow, { borderTopColor: colors.BORDER }]}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Soporta Tools</Text>
            <Switch
              value={formData.supports_tools}
              onValueChange={(value) => setFormData({ ...formData, supports_tools: value })}
              trackColor={{ false: colors.GRAY, true: colors.PRIMARY }}
              thumbColor={formData.supports_tools ? colors.PRIMARY : colors.LIGHT_GRAY}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Activar modelo</Text>
            <Switch
              value={formData.is_active}
              onValueChange={(value) => setFormData({ ...formData, is_active: value })}
              trackColor={{ false: colors.GRAY, true: colors.SUCCESS }}
              thumbColor={formData.is_active ? colors.SUCCESS : colors.LIGHT_GRAY}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.CARD_BACKGROUND, borderTopColor: colors.BORDER }
          ]}
        >
          <MyButton title="Cancelar" variant="cancel" onPress={() => onClose(false)} />
          <MyButton
            title={isEditing ? 'Guardar' : 'Crear'}
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  form: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  hint: {
    fontSize: 12,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 8
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1
  }
});
