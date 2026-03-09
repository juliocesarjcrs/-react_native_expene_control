import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { HistorySuggestion } from '~/shared/types/screens/settings/commentary-templates.types';
import { DateFormat, NumberFormat } from '~/utils/Helpers';
import { SMALL } from '~/styles/fonts';

interface HistorySuggestionsProps {
  suggestions: HistorySuggestion[];
  onSelect: (commentary: string) => void;
  onClose: () => void;
}

export default function HistorySuggestions({
  suggestions,
  onSelect,
  onClose
}: HistorySuggestionsProps) {
  const colors = useThemeColors();

  if (suggestions.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          shadowColor: colors.TEXT_PRIMARY
        }
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
        <View style={styles.headerLeft}>
          <Icon
            type="material-community"
            name="history"
            size={14}
            color={colors.TEXT_SECONDARY}
            containerStyle={{ marginRight: 4 }}
          />
          <Text style={[styles.headerText, { color: colors.TEXT_SECONDARY }]}>
            Comentarios recientes
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon type="material-community" name="close" size={16} color={colors.TEXT_SECONDARY} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {suggestions.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.item,
            index < suggestions.length - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: colors.BORDER
            }
          ]}
          onPress={() => {
            onSelect(item.commentary);
            onClose();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.itemContent}>
            <Text style={[styles.itemText, { color: colors.TEXT_PRIMARY }]} numberOfLines={2}>
              {item.commentary}
            </Text>
            <View style={styles.itemMeta}>
              <Icon
                type="material-community"
                name={item.source === 'live' ? 'cloud-check' : 'clock-outline'}
                size={11}
                color={colors.TEXT_SECONDARY}
                containerStyle={{ marginRight: 3 }}
              />
              <Text style={[styles.metaText, { color: colors.TEXT_SECONDARY }]}>
                {DateFormat(item.date, 'DD MMM')}
              </Text>
              {item.cost > 0 && (
                <>
                  <Text style={[styles.metaSeparator, { color: colors.TEXT_SECONDARY }]}>
                    {' · '}
                  </Text>
                  <Text style={[styles.metaText, { color: colors.TEXT_SECONDARY }]}>
                    {NumberFormat(item.cost)}
                  </Text>
                </>
              )}
            </View>
          </View>
          <Icon
            type="material-community"
            name="chevron-right"
            size={18}
            color={colors.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerText: {
    fontSize: SMALL - 1,
    fontWeight: '500'
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  itemContent: {
    flex: 1,
    marginRight: 8
  },
  itemText: {
    fontSize: SMALL,
    lineHeight: 18,
    marginBottom: 3
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaText: {
    fontSize: SMALL - 2
  },
  metaSeparator: {
    fontSize: SMALL - 2
  }
});
