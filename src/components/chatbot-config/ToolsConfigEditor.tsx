import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyButton from '~/components/MyButton';
import { ToolsConfig, ToolConfig } from '~/shared/types/models/chatbot-config.type';

interface ToolsConfigEditorProps {
  initialValue: ToolsConfig;
  onSave: (value: ToolsConfig) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ToolsConfigEditor: React.FC<ToolsConfigEditorProps> = ({
  initialValue,
  onSave,
  onCancel,
  loading = false
}) => {
  const colors = useThemeColors();
  const [tools, setTools] = useState<ToolConfig[]>(initialValue.tools || []);

  const toggleTool = (index: number) => {
    const updated = [...tools];
    updated[index].is_active = !updated[index].is_active;
    setTools(updated);
  };

  const updatePriority = (index: number, priority: string) => {
    const updated = [...tools];
    updated[index].priority = parseInt(priority) || 0;
    setTools(updated);
  };

  const handleSave = () => {
    onSave({ tools });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Configurar Herramientas</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
          Activa/desactiva tools y ajusta su prioridad de ejecución
        </Text>
      </View>

      <ScrollView style={styles.toolsList}>
        {tools.map((tool, index) => (
          <View
            key={tool.name}
            style={[
              styles.toolCard,
              {
                backgroundColor: colors.CARD_BACKGROUND,
                borderColor: colors.BORDER
              }
            ]}
          >
            <View style={styles.toolHeader}>
              <View style={styles.toolInfo}>
                <Text style={[styles.toolName, { color: colors.TEXT_PRIMARY }]}>{tool.name}</Text>
                {tool.description && (
                  <Text style={[styles.toolDescription, { color: colors.TEXT_SECONDARY }]}>
                    {tool.description}
                  </Text>
                )}
              </View>
              <Switch
                value={tool.is_active}
                onValueChange={() => toggleTool(index)}
                trackColor={{ false: colors.GRAY, true: colors.PRIMARY }}
                thumbColor={tool.is_active ? colors.PRIMARY : colors.LIGHT_GRAY}
              />
            </View>

            <View style={styles.priorityRow}>
              <Text style={[styles.priorityLabel, { color: colors.TEXT_SECONDARY }]}>
                Prioridad:
              </Text>
              <TextInput
                value={tool.priority.toString()}
                onChangeText={(text) => updatePriority(index, text)}
                keyboardType="number-pad"
                style={[
                  styles.priorityInput,
                  {
                    backgroundColor: colors.BACKGROUND,
                    color: colors.TEXT_PRIMARY,
                    borderColor: colors.BORDER
                  }
                ]}
              />
              <Text style={[styles.priorityHint, { color: colors.TEXT_SECONDARY }]}>
                (menor = mayor prioridad)
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.BORDER }]}>
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
  toolsList: {
    flex: 1,
    padding: 16
  },
  toolCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  toolInfo: {
    flex: 1,
    marginRight: 12
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  toolDescription: {
    fontSize: 12,
    lineHeight: 16
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  priorityLabel: {
    fontSize: 13
  },
  priorityInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
    fontSize: 14
  },
  priorityHint: {
    fontSize: 11,
    flex: 1
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
