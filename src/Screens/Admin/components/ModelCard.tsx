import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { AIModel } from '~/shared/types/models/ai-model.type';
import { updateModel, deleteModel } from '~/services/aiConfigService';
import { showError } from '~/utils/showError';

interface ModelCardProps {
  model: AIModel;
  onEdit: () => void;
  onUpdate: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onEdit, onUpdate }) => {
  const colors = useThemeColors();

  const healthColor =
    model.health_score > 0.7
      ? colors.SUCCESS
      : model.health_score > 0.4
        ? colors.WARNING
        : colors.ERROR;

  const handleToggleActive = async () => {
    try {
      await updateModel(model.id, { is_active: !model.is_active });
      Alert.alert('Éxito', `Modelo ${!model.is_active ? 'activado' : 'desactivado'}`);
      onUpdate();
    } catch (error) {
      showError(error);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmar', `¿Desactivar el modelo ${model.model_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteModel(model.id);
            Alert.alert('Éxito', 'Modelo desactivado');
            onUpdate();
          } catch (error) {
            showError(error);
          }
        }
      }
    ]);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: model.is_active ? colors.PRIMARY : colors.BORDER,
          borderWidth: model.is_active ? 2 : 1
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.priorityBadge, { backgroundColor: colors.PRIMARY }]}>
            <Text style={styles.priorityText}>{model.priority}</Text>
          </View>
          <View style={styles.modelInfo}>
            <Text style={[styles.modelName, { color: colors.TEXT_PRIMARY }]}>
              {model.model_name}
            </Text>
            <Text style={[styles.provider, { color: colors.TEXT_SECONDARY }]}>
              {model.provider_type}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: model.is_active ? colors.SUCCESS + '20' : colors.GRAY + '20' }
          ]}
        >
          <Text
            style={[styles.statusText, { color: model.is_active ? colors.SUCCESS : colors.GRAY }]}
          >
            {model.is_active ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
          <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
            Health: {(model.health_score * 100).toFixed(0)}%
          </Text>
        </View>

        <View style={styles.statItem}>
          <Icon name="alert-circle" type="material-community" size={14} color={colors.ERROR} />
          <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
            Errores: {model.error_count}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Icon name="tools" type="material-community" size={14} color={colors.INFO} />
          <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
            Tools: {model.supports_tools ? 'Sí' : 'No'}
          </Text>
        </View>
      </View>

      {/* Detalles */}
      <View style={[styles.details, { borderTopColor: colors.BORDER }]}>
        <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
          Max Tokens: {model.max_tokens} • Temp: {model.temperature}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.PRIMARY + '20' }]}
          onPress={onEdit}
        >
          <Icon name="pencil" type="material-community" size={18} color={colors.PRIMARY} />
          <Text style={[styles.actionText, { color: colors.PRIMARY }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: model.is_active ? colors.WARNING + '20' : colors.SUCCESS + '20' }
          ]}
          onPress={handleToggleActive}
        >
          <Icon
            name={model.is_active ? 'pause' : 'play'}
            type="material-community"
            size={18}
            color={model.is_active ? colors.WARNING : colors.SUCCESS}
          />
          <Text
            style={[
              styles.actionText,
              { color: model.is_active ? colors.WARNING : colors.SUCCESS }
            ]}
          >
            {model.is_active ? 'Pausar' : 'Activar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.ERROR + '20' }]}
          onPress={handleDelete}
        >
          <Icon name="delete" type="material-community" size={18} color={colors.ERROR} />
          <Text style={[styles.actionText, { color: colors.ERROR }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  priorityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  modelInfo: {
    flex: 1
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  provider: {
    fontSize: 12
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600'
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statLabel: {
    fontSize: 11
  },
  details: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12
  },
  detailText: {
    fontSize: 11
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600'
  }
});
