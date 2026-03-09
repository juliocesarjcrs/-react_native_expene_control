import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { TemplateChip } from '~/shared/types/screens/settings/commentary-templates.types';
import { SMALL } from '~/styles/fonts';

interface TemplateChipsProps {
  chips: TemplateChip[];
  onSelect: (template: string) => void;
  activeHint?: string;
}

export default function TemplateChips({ chips, onSelect, activeHint }: TemplateChipsProps) {
  const colors = useThemeColors();

  if (chips.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((chip, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.chip,
              {
                backgroundColor: colors.PRIMARY + '18',
                borderColor: colors.PRIMARY + '40'
              }
            ]}
            onPress={() => onSelect(chip.template)}
            activeOpacity={0.7}
          >
            <Icon
              type="material-community"
              name={chip.icon}
              size={14}
              color={colors.PRIMARY}
              containerStyle={styles.chipIcon}
            />
            <Text style={[styles.chipLabel, { color: colors.PRIMARY }]}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeHint ? (
        <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>{activeHint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 6
  },
  scrollContent: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row'
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1
  },
  chipIcon: {
    marginRight: 4
  },
  chipLabel: {
    fontSize: SMALL,
    fontWeight: '500'
  },
  hint: {
    fontSize: SMALL - 1,
    fontStyle: 'italic',
    marginTop: 2,
    marginLeft: 2
  }
});
