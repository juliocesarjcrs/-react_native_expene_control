import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyButton from '~/components/MyButton';

interface JsonEditorProps {
  initialValue: any;
  onSave: (value: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  initialValue,
  onSave,
  onCancel,
  loading = false
}) => {
  const colors = useThemeColors();
  const [jsonText, setJsonText] = useState(JSON.stringify(initialValue, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setError(null);
      onSave(parsed);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (text: string) => {
    setJsonText(text);
    // Validar en tiempo real
    try {
      JSON.parse(text);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          Editor JSON
        </Text>
        {error && (
          <Text style={[styles.error, { color: colors.ERROR }]}>
            ⚠️ {error}
          </Text>
        )}
      </View>

      <ScrollView style={styles.editorContainer}>
        <TextInput
          value={jsonText}
          onChangeText={handleChange}
          multiline
          style={[
            styles.textInput,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              color: colors.TEXT_PRIMARY,
              borderColor: error ? colors.ERROR : colors.BORDER
            }
          ]}
          placeholder="JSON..."
          placeholderTextColor={colors.TEXT_SECONDARY}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          // fontFamily="monospace"
        />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.BORDER }]}>
        <View style={styles.actions}>
          <MyButton
            title="Cancelar"
            variant="cancel"
            onPress={onCancel}
          />
          <MyButton
            title="Guardar"
            onPress={handleSave}
            loading={loading}
            disabled={!!error}
          />
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
  error: {
    fontSize: 12,
    marginTop: 8
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
    fontSize: 12,
    lineHeight: 18
  },
  footer: {
    padding: 16,
    borderTopWidth: 1
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  }
});