import React, { useState } from 'react';
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

type Provider = 'openrouter' | 'openai' | 'custom';

// Los campos numéricos se guardan como texto mientras se edita
type FormState = {
  provider_type: Provider;
  model_name: string;
  api_endpoint: string;
  api_key_ref: string;
  priority: string;
  is_active: boolean;
  max_tokens: string;
  temperature: string;
  supports_tools: boolean;
};

const PROVIDERS: Provider[] = ['openrouter', 'openai', 'custom'];

const DEFAULT_PRIORITY = 1;
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;
const MAX_TEMPERATURE = 2;

const buildInitialForm = (model: AIModel | null): FormState => ({
  provider_type: model?.provider_type ?? 'openrouter',
  model_name: model?.model_name ?? '',
  api_endpoint: model?.api_endpoint ?? '',
  api_key_ref: model?.api_key_ref ?? '',
  priority: String(model?.priority ?? DEFAULT_PRIORITY),
  is_active: model?.is_active ?? true,
  max_tokens: String(model?.max_tokens ?? DEFAULT_MAX_TOKENS),
  temperature: String(model?.temperature ?? DEFAULT_TEMPERATURE),
  supports_tools: model?.supports_tools ?? true
});

const parseTemperature = (text: string): number => {
  const value = Number.parseFloat(text);
  return Number.isNaN(value) ? 0 : Math.min(MAX_TEMPERATURE, Math.max(0, value));
};

// ─────────────────────────────────────────────
// Contenido (solo existe mientras el modal está abierto)
// ─────────────────────────────────────────────

const ModelEditorContent: React.FC<Omit<ModelEditorProps, 'visible'>> = ({ model, onClose }) => {
  const colors = useThemeColors();

  const [formData, setFormData] = useState<FormState>(() => buildInitialForm(model));
  const [loading, setLoading] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const inputTheme = {
    backgroundColor: colors.CARD_BACKGROUND,
    color: colors.TEXT_PRIMARY,
    borderColor: colors.BORDER
  };

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

    const payload = {
      ...formData,
      priority: Number.parseInt(formData.priority, 10) || DEFAULT_PRIORITY,
      max_tokens: Number.parseInt(formData.max_tokens, 10) || DEFAULT_MAX_TOKENS,
      temperature: parseTemperature(formData.temperature)
    };

    try {
      setLoading(true);

      if (model) {
        await updateModel(model.id, payload);
        Alert.alert('Éxito', 'Modelo actualizado correctamente');
      } else {
        await createModel(payload);
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
      visible
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
            {model ? 'Editar Modelo' : 'Nuevo Modelo'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Form */}
        <ScrollView style={styles.form}>
          {/* Provider Type */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Proveedor *</Text>
            <View style={styles.providerButtons}>
              {PROVIDERS.map((provider) => {
                const selected = formData.provider_type === provider;

                return (
                  <TouchableOpacity
                    key={provider}
                    style={[
                      styles.providerButton,
                      {
                        backgroundColor: selected ? colors.PRIMARY : colors.CARD_BACKGROUND,
                        borderColor: colors.BORDER
                      }
                    ]}
                    onPress={() => setField('provider_type', provider)}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        { color: selected ? colors.WHITE : colors.TEXT_PRIMARY }
                      ]}
                    >
                      {provider}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Model Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Nombre del Modelo *</Text>
            <TextInput
              value={formData.model_name}
              onChangeText={(text) => setField('model_name', text)}
              placeholder="ej: meta-llama/llama-3.1-8b-instruct"
              placeholderTextColor={colors.TEXT_SECONDARY}
              style={[styles.input, inputTheme]}
            />
          </View>

          {/* API Endpoint */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>API Endpoint *</Text>
            <TextInput
              value={formData.api_endpoint}
              onChangeText={(text) => setField('api_endpoint', text)}
              placeholder="ej: https://openrouter.ai/api/v1/chat/completions"
              placeholderTextColor={colors.TEXT_SECONDARY}
              style={[styles.input, inputTheme]}
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
              onChangeText={(text) => setField('api_key_ref', text)}
              placeholder="OPENROUTER_API_KEY"
              placeholderTextColor={colors.TEXT_SECONDARY}
              style={[styles.input, inputTheme]}
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
              value={formData.priority}
              onChangeText={(text) => setField('priority', text)}
              keyboardType="number-pad"
              style={[styles.input, inputTheme]}
            />
          </View>

          {/* Max Tokens */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Max Tokens</Text>
            <TextInput
              value={formData.max_tokens}
              onChangeText={(text) => setField('max_tokens', text)}
              keyboardType="number-pad"
              style={[styles.input, inputTheme]}
            />
          </View>

          {/* Temperature */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
              Temperature: {parseTemperature(formData.temperature).toFixed(2)}
            </Text>
            <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
              0 = determinista, 2 = muy creativo
            </Text>
            <TextInput
              value={formData.temperature}
              onChangeText={(text) => setField('temperature', text)}
              keyboardType="decimal-pad"
              style={[styles.input, inputTheme]}
            />
          </View>

          {/* Switches */}
          <View style={[styles.switchRow, { borderTopColor: colors.BORDER }]}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Soporta Tools</Text>
            <Switch
              value={formData.supports_tools}
              onValueChange={(value) => setField('supports_tools', value)}
              trackColor={{ false: colors.GRAY, true: colors.PRIMARY }}
              thumbColor={formData.supports_tools ? colors.PRIMARY : colors.LIGHT_GRAY}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Activar modelo</Text>
            <Switch
              value={formData.is_active}
              onValueChange={(value) => setField('is_active', value)}
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
          <MyButton title={model ? 'Guardar' : 'Crear'} onPress={handleSave} loading={loading} />
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Componente público
// ─────────────────────────────────────────────

export const ModelEditor: React.FC<ModelEditorProps> = ({ visible, ...rest }) => {
  // Mientras está cerrado no se monta nada; al abrirse, el formulario arranca limpio
  if (!visible) return null;
  return <ModelEditorContent {...rest} />;
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
  headerSpacer: {
    width: 24
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
