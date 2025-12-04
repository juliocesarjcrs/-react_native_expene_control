import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyButton from '~/components/MyButton';
import { SystemPromptConfig } from '~/shared/types/models/chatbot-config.type';

interface SystemPromptEditorProps {
  initialValue: SystemPromptConfig;
  onSave: (value: SystemPromptConfig) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({
  initialValue,
  onSave,
  onCancel,
  loading = false
}) => {
  const colors = useThemeColors();

  const [template, setTemplate] = useState(initialValue.template || '');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(template.length);
  }, [template]);

  const handleSave = () => {
    const updatedConfig: SystemPromptConfig = {
      ...initialValue,
      template: template.trim(),
      active: true
    };
    onSave(updatedConfig);
  };

  const handlePaste = (text: string) => {
    // Normalizar saltos de línea
    const normalized = text
      .replace(/\r\n/g, '\n') // Windows
      .replace(/\r/g, '\n'); // Old Mac
    setTemplate(normalized);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Editar System Prompt</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
          Escribe o pega el prompt directamente. Los saltos de línea se preservarán automáticamente.
        </Text>
      </View>

      <ScrollView style={styles.editorContainer}>
        <TextInput
          value={template}
          onChangeText={setTemplate}
          multiline
          style={[
            styles.textInput,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              color: colors.TEXT_PRIMARY,
              borderColor: colors.BORDER
            }
          ]}
          placeholder="Pega o escribe el prompt aquí..."
          placeholderTextColor={colors.TEXT_SECONDARY}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.BORDER }]}>
        <Text style={[styles.charCount, { color: colors.TEXT_SECONDARY }]}>
          {charCount.toLocaleString()} caracteres
        </Text>

        <View style={styles.actions}>
          <MyButton title="Cancelar" variant="cancel" onPress={onCancel} />
          <MyButton title="Guardar" onPress={handleSave} loading={loading} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    padding: 16,
    borderBottomWidth: 1
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18
  },
  editorContainer: {
    flex: 1,
    padding: 16
  },
  textInput: {
    minHeight: 400,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'monospace'
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  charCount: {
    fontSize: 12
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  }
});
