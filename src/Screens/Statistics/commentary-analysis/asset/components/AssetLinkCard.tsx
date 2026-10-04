/**
 * Pregunta (una sola vez) cuál es la categoría de ingreso del bien y la recuerda.
 * Ubicación: src/Screens/Statistics/commentary-analysis/asset/components/AssetLinkCard.tsx
 */
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

import SelectOnlyCategory from '~/components/dropDown/SelectOnlyCategory';
import MyButton from '~/components/MyButton';
import { DropDownSelectFormat } from '~/shared/types/components';
import { AssetLink, parseAliasInput } from '~/utils/commentary/assetLinks.utils';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface AssetLinkCardProps {
  /** null = todavía no se ha preguntado */
  link: AssetLink | null;
  onSave: (link: AssetLink) => void;
  onClear: () => void;
}

export default function AssetLinkCard({ link, onSave, onClear }: AssetLinkCardProps) {
  const colors = useThemeColors();
  const selectRef = useRef<any>(null);
  const [selected, setSelected] = useState<DropDownSelectFormat | null>(null);
  const [aliasText, setAliasText] = useState('');
  const aliases = parseAliasInput(aliasText);

  // Ya vinculado: línea compacta con opción de cambiar
  if (link !== null) {
    return (
      <View style={[styles.compact, { backgroundColor: colors.INFO + '15' }]}>
        <Icon type="material-community" name="home-account" size={16} color={colors.INFO} />
        <Text style={[styles.compactText, { color: colors.TEXT_PRIMARY }]}>
          {link.kind === 'none'
            ? 'Este bien no genera arriendo'
            : link.aliases && link.aliases.length > 0
              ? `Arriendo: ${link.categoryName} · [Bien: ${link.aliases.join(', ')}]`
              : `Arriendo: ${link.categoryName} · cuenta todos los ingresos de la categoría`}
        </Text>
        <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
          <Text style={[styles.change, { color: colors.INFO }]}>Cambiar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canSave = selected !== null && selected.id !== null && aliases.length > 0;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
        ¿Dónde registras el arriendo de este bien?
      </Text>
      <Text style={[styles.body, { color: colors.TEXT_SECONDARY }]}>
        Elige la categoría de ingreso (ej: &quot;Arriendos&quot;) y escribe el nombre del bien tal
        como va en [Bien: …] de cada arriendo. Solo te lo pregunto una vez; queda guardado.
      </Text>

      <View style={styles.selectWrap}>
        <SelectOnlyCategory
          searchType={1}
          handleCategoryChange={(data: DropDownSelectFormat) => setSelected(data)}
          ref={selectRef}
        />
      </View>

      <TextInput
        value={aliasText}
        onChangeText={setAliasText}
        placeholder="Nombre del bien. Ej: Apt 1102"
        placeholderTextColor={colors.TEXT_SECONDARY}
        autoCapitalize="none"
        style={[styles.input, { color: colors.TEXT_PRIMARY, borderColor: colors.BORDER }]}
      />
      <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
        Si el bien se ha llamado de varias formas, sepáralas con coma.
      </Text>

      <MyButton
        title="Guardar"
        variant="primary"
        disabled={!canSave}
        onPress={() => {
          if (selected && selected.id !== null) {
            onSave({
              kind: 'income',
              categoryId: selected.id,
              categoryName: selected.label,
              aliases
            });
          }
        }}
      />

      <TouchableOpacity onPress={() => onSave({ kind: 'none' })} activeOpacity={0.7}>
        <Text style={[styles.noRent, { color: colors.INFO }]}>
          Este bien no genera arriendo (lote, en construcción...)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16, gap: 10 },
  title: { fontSize: MEDIUM, fontWeight: '600' },
  body: { fontSize: SMALL, lineHeight: 18 },
  selectWrap: { zIndex: 3000 },
  noRent: { fontSize: SMALL, textAlign: 'center', paddingVertical: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SMALL + 2
  },
  hint: { fontSize: SMALL - 1 },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8
  },
  compactText: { flex: 1, fontSize: SMALL },
  change: { fontSize: SMALL, fontWeight: '600' }
});
