import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';

// Types
import { SettingsStackParamList } from '~/shared/types';
import {
  SubcategoryTemplateConfig,
  TemplateChip
} from '~/shared/types/screens/settings/commentary-templates.types';

// Utils
import {
  getAllCustomizedTemplates,
  resetTemplateConfig,
  saveTemplateConfig
} from '~/utils/templateStorage.utils';
import { getDefaultTemplateConfig } from '~/utils/commentaryTemplates.utils';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

// ============================================================
// TIPOS DE NAVEGACIÓN
// ============================================================

type CommentaryTemplatesNavigationProp = StackNavigationProp<SettingsStackParamList>;
type CommentaryTemplatesRouteProp = RouteProp<SettingsStackParamList>;

interface CommentaryTemplatesScreenProps {
  navigation: CommentaryTemplatesNavigationProp;
  route: CommentaryTemplatesRouteProp;
}

// ============================================================
// PANTALLA PRINCIPAL
// ============================================================

export default function CommentaryTemplatesScreen({ navigation }: CommentaryTemplatesScreenProps) {
  const config = screenConfigs.commentaryTemplates;
  const colors = useThemeColors();

  const [templates, setTemplates] = useState<SubcategoryTemplateConfig[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
    return navigation.addListener('focus', loadTemplates);
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const customized = await getAllCustomizedTemplates();
      setTemplates(customized);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (template: SubcategoryTemplateConfig) => {
    Alert.alert(
      'Restaurar plantilla',
      `¿Restaurar la plantilla de "${template.subcategoryName}" a sus valores por defecto?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetTemplateConfig(template.subcategoryId);
              await loadTemplates();
            } catch (error) {
              showError(error);
            }
          }
        }
      ]
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ScreenHeader title={config.title} subtitle={config.subtitle} />
        <MyLoading />
      </View>
    );
  }

  return (
    <ScrollView
      style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {/* Info banner */}
      <View
        style={[
          styles.infoBanner,
          { backgroundColor: colors.INFO + '15', borderColor: colors.INFO + '40' }
        ]}
      >
        <Icon
          type="material-community"
          name="information"
          size={16}
          color={colors.INFO}
          containerStyle={{ marginRight: 8 }}
        />
        <Text style={[styles.infoText, { color: colors.INFO }]}>
          Las plantillas se crean automáticamente al usar por primera vez una subcategoría. Aquí
          puedes ver y editar las que hayas personalizado.
        </Text>
      </View>

      {/* Lista de plantillas personalizadas */}
      {templates.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <View style={styles.list}>
          {templates.map((template) => (
            <TemplateCard
              key={template.subcategoryId}
              template={template}
              expanded={expandedId === template.subcategoryId}
              onToggle={() => toggleExpand(template.subcategoryId)}
              onReset={() => handleReset(template)}
              onSave={async (updated) => {
                try {
                  await saveTemplateConfig(updated);
                  await loadTemplates();
                } catch (error) {
                  showError(error);
                }
              }}
              colors={colors}
            />
          ))}
        </View>
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

// ============================================================
// SUB-COMPONENTE: Tarjeta de plantilla
// ============================================================

interface TemplateCardProps {
  template: SubcategoryTemplateConfig;
  expanded: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSave: (updated: SubcategoryTemplateConfig) => Promise<void>;
  colors: ReturnType<typeof useThemeColors>;
}

function TemplateCard({
  template,
  expanded,
  onToggle,
  onReset,
  onSave,
  colors
}: TemplateCardProps) {
  const [editingChipIndex, setEditingChipIndex] = useState<number | null>(null);
  const [chipDraft, setChipDraft] = useState<TemplateChip | null>(null);
  const [saving, setSaving] = useState(false);

  const assistanceBadgeColor = {
    structured: colors.SUCCESS,
    semi: colors.WARNING,
    free: colors.TEXT_SECONDARY
  }[template.assistanceLevel];

  const assistanceLabel = {
    structured: 'Parser activo',
    semi: 'Semi-estructurado',
    free: 'Libre'
  }[template.assistanceLevel];

  const handleEditChip = (index: number) => {
    setEditingChipIndex(index);
    setChipDraft({ ...template.chips[index] });
  };

  const handleSaveChip = async () => {
    if (editingChipIndex === null || !chipDraft) return;
    setSaving(true);
    try {
      const updatedChips = [...template.chips];
      updatedChips[editingChipIndex] = chipDraft;
      await onSave({ ...template, chips: updatedChips });
      setEditingChipIndex(null);
      setChipDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingChipIndex(null);
    setChipDraft(null);
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      {/* Header de la tarjeta */}
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.cardTitle, { color: colors.TEXT_PRIMARY }]}>
            {template.subcategoryName}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.TEXT_SECONDARY }]}>
            {template.categoryName}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={[styles.badge, { backgroundColor: assistanceBadgeColor + '20' }]}>
            <Text style={[styles.badgeText, { color: assistanceBadgeColor }]}>
              {assistanceLabel}
            </Text>
          </View>
          <Icon
            type="material-community"
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.TEXT_SECONDARY}
          />
        </View>
      </TouchableOpacity>

      {/* Detalle expandido */}
      {expanded && (
        <View style={[styles.cardBody, { borderTopColor: colors.BORDER }]}>
          {template.chips.length === 0 ? (
            <Text style={[styles.emptyChips, { color: colors.TEXT_SECONDARY }]}>
              Sin chips de plantilla configurados
            </Text>
          ) : (
            template.chips.map((chip, index) => (
              <ChipEditor
                key={index}
                chip={chip}
                isEditing={editingChipIndex === index}
                draft={editingChipIndex === index ? chipDraft! : chip}
                onEdit={() => handleEditChip(index)}
                onSave={handleSaveChip}
                onCancel={handleCancelEdit}
                onDraftChange={setChipDraft}
                saving={saving}
                colors={colors}
              />
            ))
          )}

          {/* Acciones */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.ERROR + '60' }]}
              onPress={onReset}
            >
              <Icon type="material-community" name="restore" size={14} color={colors.ERROR} />
              <Text style={[styles.actionBtnText, { color: colors.ERROR }]}>
                Restaurar defaults
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================
// SUB-COMPONENTE: Editor de chip individual
// ============================================================

interface ChipEditorProps {
  chip: TemplateChip;
  isEditing: boolean;
  draft: TemplateChip;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDraftChange: (chip: TemplateChip) => void;
  saving: boolean;
  colors: ReturnType<typeof useThemeColors>;
}

function ChipEditor({
  chip,
  isEditing,
  draft,
  onEdit,
  onSave,
  onCancel,
  onDraftChange,
  saving,
  colors
}: ChipEditorProps) {
  if (!isEditing) {
    return (
      <View style={[styles.chipRow, { borderColor: colors.BORDER }]}>
        <View style={styles.chipInfo}>
          <Text style={[styles.chipLabel, { color: colors.PRIMARY }]}>{chip.label}</Text>
          <Text style={[styles.chipTemplate, { color: colors.TEXT_SECONDARY }]} numberOfLines={2}>
            {chip.template}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onEdit}
          style={styles.editBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon type="material-community" name="pencil-outline" size={18} color={colors.PRIMARY} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.chipEditContainer,
        { borderColor: colors.PRIMARY, backgroundColor: colors.PRIMARY + '08' }
      ]}
    >
      <Text style={[styles.editFieldLabel, { color: colors.TEXT_SECONDARY }]}>
        Etiqueta del chip
      </Text>
      <TextInput
        style={[
          styles.editInput,
          {
            color: colors.TEXT_PRIMARY,
            borderColor: colors.BORDER,
            backgroundColor: colors.CARD_BACKGROUND
          }
        ]}
        value={draft.label}
        onChangeText={(text) => onDraftChange({ ...draft, label: text })}
        placeholder="Ej: Con descuento"
        placeholderTextColor={colors.TEXT_SECONDARY}
      />

      <Text style={[styles.editFieldLabel, { color: colors.TEXT_SECONDARY }]}>
        Texto de la plantilla
      </Text>
      <TextInput
        style={[
          styles.editInput,
          styles.editInputMultiline,
          {
            color: colors.TEXT_PRIMARY,
            borderColor: colors.BORDER,
            backgroundColor: colors.CARD_BACKGROUND
          }
        ]}
        value={draft.template}
        onChangeText={(text) => onDraftChange({ ...draft, template: text })}
        placeholder="Texto que se insertará en el comentario"
        placeholderTextColor={colors.TEXT_SECONDARY}
        multiline
        numberOfLines={3}
      />

      <Text style={[styles.editFieldLabel, { color: colors.TEXT_SECONDARY }]}>
        Descripción de ayuda (opcional)
      </Text>
      <TextInput
        style={[
          styles.editInput,
          {
            color: colors.TEXT_PRIMARY,
            borderColor: colors.BORDER,
            backgroundColor: colors.CARD_BACKGROUND
          }
        ]}
        value={draft.hint ?? ''}
        onChangeText={(text) => onDraftChange({ ...draft, hint: text })}
        placeholder="Ej: Para cuando hay descuento en Carulla"
        placeholderTextColor={colors.TEXT_SECONDARY}
      />

      <View style={styles.editActions}>
        <TouchableOpacity
          style={[styles.editActionBtn, { backgroundColor: colors.ERROR + '15' }]}
          onPress={onCancel}
        >
          <Text style={[styles.editActionText, { color: colors.ERROR }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editActionBtn, { backgroundColor: colors.PRIMARY }]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={[styles.editActionText, { color: '#fff' }]}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// SUB-COMPONENTE: Estado vacío
// ============================================================

function EmptyState({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.emptyContainer}>
      <Icon
        type="material-community"
        name="text-box-outline"
        size={52}
        color={colors.TEXT_SECONDARY}
      />
      <Text style={[styles.emptyTitle, { color: colors.TEXT_PRIMARY }]}>
        Aún no hay plantillas registradas
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.TEXT_SECONDARY }]}>
        Las plantillas aparecen automáticamente la primera vez que registras un gasto en cada
        subcategoría. Crea un gasto en Luz, Agua, Proteínas, etc. y vuelve aquí.
      </Text>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16
  },
  infoText: {
    flex: 1,
    fontSize: SMALL,
    lineHeight: 18
  },
  list: {
    gap: 10
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8
  },
  cardTitle: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  cardSubtitle: {
    fontSize: SMALL - 1,
    marginTop: 2
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20
  },
  badgeText: {
    fontSize: SMALL - 2,
    fontWeight: '600'
  },
  cardBody: {
    borderTopWidth: 1,
    padding: 14,
    gap: 10
  },
  emptyChips: {
    fontSize: SMALL,
    fontStyle: 'italic'
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8
  },
  chipInfo: {
    flex: 1,
    marginRight: 8
  },
  chipLabel: {
    fontSize: SMALL,
    fontWeight: '600',
    marginBottom: 3
  },
  chipTemplate: {
    fontSize: SMALL - 1,
    fontFamily: 'monospace'
  },
  editBtn: {
    padding: 4
  },
  chipEditContainer: {
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    gap: 6
  },
  editFieldLabel: {
    fontSize: SMALL - 1,
    fontWeight: '500',
    marginBottom: 2
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: SMALL,
    marginBottom: 4
  },
  editInputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top'
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  editActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  editActionText: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  cardActions: {
    marginTop: 4
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6
  },
  actionBtnText: {
    fontSize: SMALL,
    fontWeight: '500'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10
  },
  emptyTitle: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  emptySubtitle: {
    fontSize: SMALL,
    textAlign: 'center',
    lineHeight: 20
  },
  bottomPad: {
    height: 40
  }
});
